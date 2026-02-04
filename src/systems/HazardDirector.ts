import fs from 'node:fs/promises';

import type { World } from 'hytopia';

type HazardAdd = { type: string; params: Record<string, any> };
type Phase = { tMs: number; add: HazardAdd[] };

type RisingFluidState = { height: number; riseRate: number };

export class HazardDirector {
  private phases: Phase[] = [];
  private timers: NodeJS.Timeout[] = [];
  private risingFluid: RisingFluidState | null = null;
  private riseInterval: NodeJS.Timeout | null = null;

  constructor(private opts: { schedulePath: string; world: World }) {}

  async loadSchedule() {
    const raw = await fs.readFile(this.opts.schedulePath, 'utf8');
    const json = JSON.parse(raw);
    this.phases = Array.isArray(json.phases) ? json.phases : [];
  }

  start(seed: number) {
    // MVP: implement rising fluid as a kill-height that increases over time.
    // Other hazards remain logged-only stubs for now.

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

    // Start ticking the rising fluid height.
    this.riseInterval = setInterval(() => {
      if (!this.risingFluid) return;
      // riseRate is units per second
      this.risingFluid.height += (this.risingFluid.riseRate * 50) / 1000;
    }, 50);
  }

  stop() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];

    if (this.riseInterval) clearInterval(this.riseInterval);
    this.riseInterval = null;
    this.risingFluid = null;

    // TODO(Hytopia): despawn/disable all active hazards
  }

  getKillY() {
    return this.risingFluid ? this.risingFluid.height : -9999;
  }

  private spawnHazard(type: string, params: Record<string, any>, ctx: { seed: number; tSinceStartMs: number }) {
    if (type === 'rising_fluid') {
      const startHeight = Number(params?.startHeight ?? 0);
      const riseRate = Number(params?.riseRate ?? 0.02);
      this.risingFluid = { height: startHeight, riseRate };
      console.log('[HazardDirector] rising_fluid', { startHeight, riseRate, ctx });
      return;
    }

    // Stub: replace with real hazard implementations
    console.log('[HazardDirector] spawn (stub)', { type, params, ctx });
  }
}
