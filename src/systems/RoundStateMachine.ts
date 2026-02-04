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
      await this.enterCountdown(5_000);
      await this.enterRunning();
      const results = await this.enterResults();
      await this.deps.rewards.grantRoundRewards(results);
      await this.deps.quests.progressFromRound(results);

      // TODO: break condition / server shutdown handling.
    }
  }

  private async enterLobby() {
    this.state = 'LOBBY';

    // Reset players to lobby spawn.
    for (const ent of this.playerEntities.values()) {
      if (ent.isSpawned) ent.setPosition(this.deps.positions.LOBBY_SPAWN);
    }

    await this.waitUntil(() => this.players.size >= this.minPlayers);
  }

  private async enterCountdown(ms: number) {
    this.state = 'COUNTDOWN';
    // TODO: UI — countdown
    await this.sleep(ms);
  }

  private async enterRunning() {
    this.state = 'RUNNING';
    this.seed = Math.floor(Math.random() * 1_000_000);

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
    // MVP: no placements yet.
    await this.sleep(5_000);
    return [];
  }

  eliminate(playerId: string, info: { reason: string }) {
    // MVP: instantly reset to lobby spawn.
    const ent = this.playerEntities.get(playerId);
    if (ent?.isSpawned) ent.setPosition(this.deps.positions.LOBBY_SPAWN);
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
