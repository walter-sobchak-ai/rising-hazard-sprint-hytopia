// Rising Hazard Sprint — HYTOPIA SDK scaffold
// Mechanics-only prototype: no Roblox IP/branding/assets.

import {
  BlockType,
  DefaultPlayerEntity,
  DefaultPlayerEntityController,
  EntityEvent,
  Player,
  PlayerEvent,
  startServer,
  World,
} from 'hytopia';

import { RoundStateMachine } from './src/systems/RoundStateMachine.js';
import { HazardDirector } from './src/systems/HazardDirector.js';
import { RewardsService } from './src/systems/RewardsService.js';
import { QuestsService } from './src/systems/QuestsService.js';

// Spiral climb course (procedural)
const COURSE = {
  baseY: 2,
  steps: 42,
  radius: 9,
  stepHeight: 1,
  platformHalfExtents: { x: 2, y: 0.5, z: 2 },
};

const POSITIONS = {
  LOBBY_SPAWN: { x: 0, y: 6, z: 0 },
  RUN_SPAWN: { x: 0, y: COURSE.baseY + 2, z: 0 },
};

// Minimal floor so players don't instantly fall.
const FLOOR = { from: { x: -16, z: -16 }, to: { x: 16, z: 16 }, y: 0 };

function degToRad(d: number) { return (d * Math.PI) / 180; }
function round(n: number) { return Math.round(n); }


startServer((world: World) => {
  bootstrapMinimalWorld(world);

  const rewards = new RewardsService();
  const quests = new QuestsService();
  const hazards = new HazardDirector({ schedulePath: 'data/hazardSchedule.json', world });
  const rounds = new RoundStateMachine({ hazards, rewards, quests, world, positions: POSITIONS });

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => onPlayerJoin(world, rounds, player));
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => onPlayerLeave(world, rounds, player));

  void rounds.start();
});

function bootstrapMinimalWorld(world: World) {
  // Register a couple block types and lay down a floor + a simple climb course.
  const FLOOR_BLOCK_TYPE_ID = 10;
  const COURSE_BLOCK_TYPE_ID = 11;

  world.blockTypeRegistry.registerBlockType(
    new BlockType({
      id: FLOOR_BLOCK_TYPE_ID,
      name: 'Floor',
      textureUri: 'blocks/grass',
    })
  );

  world.blockTypeRegistry.registerBlockType(
    new BlockType({
      id: COURSE_BLOCK_TYPE_ID,
      name: 'Course',
      textureUri: 'blocks/void-sand.png',
    })
  );

  // Base floor
  for (let x = FLOOR.from.x; x <= FLOOR.to.x; x++) {
    for (let z = FLOOR.from.z; z <= FLOOR.to.z; z++) {
      world.chunkLattice.setBlock({ x, y: FLOOR.y, z }, FLOOR_BLOCK_TYPE_ID);
    }
  }

  // Spiral stair platforms — each step is a small platform in a circle, climbing upward.
  for (let i = 0; i < COURSE.steps; i++) {
    const angle = degToRad(i * (360 / 14)); // 14 steps per full rotation
    const x0 = round(Math.cos(angle) * COURSE.radius);
    const z0 = round(Math.sin(angle) * COURSE.radius);
    const y0 = COURSE.baseY + i * COURSE.stepHeight;

    const hx = COURSE.platformHalfExtents.x;
    const hy = COURSE.platformHalfExtents.y;
    const hz = COURSE.platformHalfExtents.z;

    for (let x = x0 - hx; x <= x0 + hx; x++) {
      for (let z = z0 - hz; z <= z0 + hz; z++) {
        for (let y = y0; y <= y0 + hy; y++) {
          world.chunkLattice.setBlock({ x, y, z }, COURSE_BLOCK_TYPE_ID);
        }
      }
    }
  }
}

function onPlayerJoin(world: World, rounds: RoundStateMachine, player: Player) {
  const playerEntity = new DefaultPlayerEntity({
    player,
    name: 'Player',
  });

  playerEntity.spawn(world, POSITIONS.LOBBY_SPAWN);
  (playerEntity.controller as DefaultPlayerEntityController).canSwim = () => false;

  // Solo mode:
  // - Track best height
  // - Eliminate when below rising hazard
  // - Also eliminate if you fall far off the course
  playerEntity.on(EntityEvent.TICK, () => {
    rounds.observe(player.id);

    const killY = rounds.getKillY();
    if (playerEntity.position.y < killY) {
      rounds.eliminate(player.id, { reason: 'lava' });
      return;
    }

    if (playerEntity.position.y < -25) {
      rounds.eliminate(player.id, { reason: 'fell' });
      return;
    }
  });

  rounds.onPlayerJoin(player.id, playerEntity);
}

function onPlayerLeave(world: World, rounds: RoundStateMachine, player: Player) {
  // Despawn their player entity(ies)
  world.entityManager.getPlayerEntitiesByPlayer(player).forEach((entity) => {
    entity.despawn();
  });
  rounds.onPlayerLeave(player.id);
}
