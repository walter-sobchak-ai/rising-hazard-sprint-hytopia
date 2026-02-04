export type RoundState = 'RUNNING';

import type { DefaultPlayerEntity, World } from 'hytopia';

export interface RoundDeps {
  world: World;
  hazards: { loadSchedule(): Promise<void>; start(seed: number): void; stop(): void };
}

type RunStats = {
  runStartY: number;
  bestYThisRun: number;
  bestYAllTime: number;
};

export class RoundStateMachine {
  private state: RoundState = 'RUNNING';
  private seed = 0;

  private players = new Set<string>();
  private playerEntities = new Map<string, DefaultPlayerEntity>();
  private runStats = new Map<string, RunStats>();

  constructor(private deps: RoundDeps & { positions: { RUN_SPAWN: any } }) {}

  async start() {
    await this.deps.hazards.loadSchedule();

    // In solo mode, we keep the world "always running": hazards start once.
    this.seed = Math.floor(Math.random() * 1_000_000);
    this.deps.hazards.start(this.seed);

    this.deps.world.chatManager.sendBroadcastMessage('Solo Mode: climb as high as you can before the lava catches you.');
  }

  onPlayerJoin(playerId: string, entity?: DefaultPlayerEntity) {
    this.players.add(playerId);
    if (entity) {
      this.playerEntities.set(playerId, entity);
      this.resetRun(playerId);
    }
  }

  onPlayerLeave(playerId: string) {
    this.players.delete(playerId);
    this.playerEntities.delete(playerId);
    this.runStats.delete(playerId);
  }

  // Call this from a player tick to track height.
  observe(playerId: string) {
    const ent = this.playerEntities.get(playerId);
    const stats = this.runStats.get(playerId);
    if (!ent?.isSpawned || !stats) return;

    const y = ent.position.y;
    if (y > stats.bestYThisRun) stats.bestYThisRun = y;
    if (y > stats.bestYAllTime) stats.bestYAllTime = y;
  }

  getStats(playerId: string) {
    return this.runStats.get(playerId);
  }

  eliminate(playerId: string, info: { reason: string }) {
    const ent = this.playerEntities.get(playerId);
    const stats = this.runStats.get(playerId);
    if (!ent?.isSpawned || !stats) return;

    const bestThisRun = Math.floor(stats.bestYThisRun);
    const bestAllTime = Math.floor(stats.bestYAllTime);

    this.deps.world.chatManager.sendPlayerMessage(
      ent.player,
      `Eliminated (${info.reason}). Best height: ${bestThisRun}. Personal best: ${bestAllTime}.`,
      'FFAA00'
    );

    ent.setPosition(this.deps.positions.RUN_SPAWN);
    ent.setLinearVelocity({ x: 0, y: 0, z: 0 });

    this.resetRun(playerId);
  }

  private resetRun(playerId: string) {
    const ent = this.playerEntities.get(playerId);
    if (!ent?.isSpawned) return;

    const existing = this.runStats.get(playerId);
    const bestAllTime = existing?.bestYAllTime ?? ent.position.y;

    this.runStats.set(playerId, {
      runStartY: ent.position.y,
      bestYThisRun: ent.position.y,
      bestYAllTime: bestAllTime,
    });
  }

  getKillY() {
    // @ts-ignore
    return typeof (this.deps.hazards as any).getKillY === 'function' ? (this.deps.hazards as any).getKillY() : -9999;
  }
}
