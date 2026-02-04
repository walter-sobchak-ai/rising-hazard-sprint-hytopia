import fs from 'node:fs/promises';

import { Entity, RigidBodyType } from 'hytopia';
import type { World } from 'hytopia';

type HazardAdd = { type: string; params: Record<string, any> };
type Phase = { tMs: number; add: HazardAdd[] };

type RisingFluidState = { height: number; riseRate: number };

export class HazardDirector {
  private phases: Phase[] = [];
  private timers: NodeJS.Timeout[] = [];

  private risingFluid: RisingFluidState | null = null;
  private risingFluidEntity: Entity | null = null;
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

      // Visualize as a thin rising block plane.
      if (this.risingFluidEntity?.isSpawned) {
        this.risingFluidEntity.setPosition({ x: 0, y: this.risingFluid.height, z: 0 });
      }
    }, 50);
  }

  stop() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];

    if (this.riseInterval) clearInterval(this.riseInterval);
    this.riseInterval = null;
    this.risingFluid = null;

    if (this.risingFluidEntity?.isSpawned) this.risingFluidEntity.despawn();
    this.risingFluidEntity = null;

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

      // Spawn a visual plane. Uses local asset (copy from sdk-examples): assets/blocks/lava.png
      this.risingFluidEntity = new Entity({
        name: 'Rising Fluid',
        blockTextureUri: 'blocks/lava.png',
        // Smaller footprint so it reads as a “danger zone” around the course.
        blockHalfExtents: { x: 18, y: 0.25, z: 18 },
        opacity: 0.65,
        rigidBodyOptions: {
          type: RigidBodyType.KINEMATIC_POSITION,
          enabledRotations: { x: false, y: false, z: false },
          enabledPositions: { x: false, y: true, z: false },
        },
      });

      this.risingFluidEntity.spawn(this.opts.world, { x: 0, y: startHeight, z: 0 });

      console.log('[HazardDirector] rising_fluid', { startHeight, riseRate, ctx });
      return;
    }

    // Stub: replace with real hazard implementations
    console.log('[HazardDirector] spawn (stub)', { type, params, ctx });
  }
}
