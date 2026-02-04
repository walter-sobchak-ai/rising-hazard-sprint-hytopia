export type RoundState = 'LOBBY' | 'COUNTDOWN' | 'RUNNING' | 'RESULTS';

import type { World } from 'hytopia';

export interface RoundDeps {
  world: World;
  hazards: { loadSchedule(): Promise<void>; start(seed: number): void; stop(): void };
  rewards: { grantRoundRewards(results: any[]): Promise<void> };
  quests: { progressFromRound(results: any[]): Promise<void> };
}

import type { DefaultPlayerEntity } from 'hytopia';

export class RoundStateMachine {
  private state: RoundState = 'LOBBY';
  private seed = 0;
  private roundDurationMs = 120_000;
  private lobbyWaitMs = 12_000;
  private countdownMs = 5_000;
  private minPlayers = 1;
  private players = new Set<string>();
  private playerEntities = new Map<string, DefaultPlayerEntity>();

  constructor(private deps: RoundDeps & { positions: { LOBBY_SPAWN: any; RUN_SPAWN: any } }) {}

  async start() {
    await this.deps.hazards.loadSchedule();

    // TODO: replace with tick loop / scheduler from Hytopia.
    // For scaffold purposes, we just outline the flow.
    await this.loop();
  }

  onPlayerJoin(playerId: string, entity?: DefaultPlayerEntity) {
    this.players.add(playerId);
    if (entity) this.playerEntities.set(playerId, entity);
  }

  onPlayerLeave(playerId: string) {
    this.players.delete(playerId);
    this.playerEntities.delete(playerId);
  }

  private async loop() {
    while (true) {
      await this.enterLobby();
      await this.enterCountdown(this.countdownMs);
      await this.enterRunning();
      const results = await this.enterResults();
      await this.deps.rewards.grantRoundRewards(results);
      await this.deps.quests.progressFromRound(results);

      // TODO: break condition / server shutdown handling.
    }
  }

  private async enterLobby() {
    this.state = 'LOBBY';

    this.deps.world.chatManager.sendBroadcastMessage('Lobby: next round starting soon...');

    // Reset players to lobby spawn.
    for (const ent of this.playerEntities.values()) {
      if (ent.isSpawned) ent.setPosition(this.deps.positions.LOBBY_SPAWN);
    }

    await this.waitUntil(() => this.players.size >= this.minPlayers);
    await this.sleep(this.lobbyWaitMs);
  }

  private async enterCountdown(ms: number) {
    this.state = 'COUNTDOWN';
    this.deps.world.chatManager.sendBroadcastMessage(`Round starts in ${Math.ceil(ms / 1000)}...`);
    await this.sleep(ms);
  }

  private async enterRunning() {
    this.state = 'RUNNING';
    this.seed = Math.floor(Math.random() * 1_000_000);

    this.deps.world.chatManager.sendBroadcastMessage('GO! Survive the rising hazard.');

    // Spawn/teleport players to run start.
    for (const ent of this.playerEntities.values()) {
      if (ent.isSpawned) ent.setPosition(this.deps.positions.RUN_SPAWN);
    }

    this.deps.hazards.start(this.seed);
    await this.sleep(this.roundDurationMs);
    this.deps.hazards.stop();
  }

  private async enterResults(): Promise<any[]> {
    this.state = 'RESULTS';
    this.deps.world.chatManager.sendBroadcastMessage('Round over. Play again!');
    await this.sleep(6_000);
    return [];
  }

  eliminate(playerId: string, info: { reason: string }) {
    const ent = this.playerEntities.get(playerId);
    if (!ent?.isSpawned) return;

    // If we're in a run, respawn at run start; otherwise lobby.
    const spawn = this.state === 'RUNNING' ? this.deps.positions.RUN_SPAWN : this.deps.positions.LOBBY_SPAWN;
    ent.setPosition(spawn);
    ent.setLinearVelocity({ x: 0, y: 0, z: 0 });
  }

  getKillY() {
    // @ts-ignore
    return typeof (this.deps.hazards as any).getKillY === 'function' ? (this.deps.hazards as any).getKillY() : -9999;
  }

  private sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms));
  }

  private async waitUntil(pred: () => boolean) {
    while (!pred()) await this.sleep(250);
  }
}
