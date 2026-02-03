import fs from 'node:fs/promises';

type HazardAdd = { type: string; params: Record<string, any> };
type Phase = { tMs: number; add: HazardAdd[] };

export class HazardDirector {
  private phases: Phase[] = [];
  private timers: NodeJS.Timeout[] = [];

  constructor(private opts: { schedulePath: string }) {}

  async loadSchedule() {
    const raw = await fs.readFile(this.opts.schedulePath, 'utf8');
    const json = JSON.parse(raw);
    this.phases = Array.isArray(json.phases) ? json.phases : [];
  }

  start(seed: number) {
    // TODO(Hytopia): use deterministic RNG seeded by `seed` for hazard params.
    // TODO(Hytopia): spawn hazards in the world and register damage/knockback.

    this.stop();
    const t0 = Date.now();

    for (const phase of this.phases) {
      const delay = Math.max(0, phase.tMs);
      const timer = setTimeout(() => {
        for (const add of phase.add || []) {
          this.spawnHazard(add.type, add.params, { seed, tSinceStartMs: Date.now() - t0 });
        }
      }, delay);
      this.timers.push(timer);
    }
  }

  stop() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    // TODO(Hytopia): despawn/disable all active hazards
  }

  private spawnHazard(type: string, params: Record<string, any>, ctx: { seed: number; tSinceStartMs: number }) {
    // Stub: replace with real hazard implementations
    // Examples:
    // - rising_fluid: move a kill plane upward
    // - sweeper: rotating arm that knocks players
    // - falling_tiles: mark tiles to fall after stepped on
    // - wind_gust: periodic impulse in a direction
    console.log('[HazardDirector] spawn', { type, params, ctx });
  }
}
