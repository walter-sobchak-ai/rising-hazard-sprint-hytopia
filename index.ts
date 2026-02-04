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

const POSITIONS = {
  LOBBY_SPAWN: { x: 0, y: 6, z: 0 },
  RUN_SPAWN: { x: 0, y: 6, z: 0 },
};

// Minimal floor so players don't instantly fall.
const FLOOR = { from: { x: -12, z: -12 }, to: { x: 12, z: 12 }, y: 0 };

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
  // Register a simple block type and lay down a floor.
  const FLOOR_BLOCK_TYPE_ID = 10;
  world.blockTypeRegistry.registerBlockType(
    new BlockType({
      id: FLOOR_BLOCK_TYPE_ID,
      name: 'Floor',
      textureUri: 'blocks/grass',
    })
  );

  for (let x = FLOOR.from.x; x <= FLOOR.to.x; x++) {
    for (let z = FLOOR.from.z; z <= FLOOR.to.z; z++) {
      world.chunkLattice.setBlock({ x, y: FLOOR.y, z }, FLOOR_BLOCK_TYPE_ID);
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

  // MVP elimination: if you go below the rising fluid height, you "die" and get reset.
  playerEntity.on(EntityEvent.TICK, () => {
    const killY = rounds.getKillY();
    if (playerEntity.position.y < killY) {
      rounds.eliminate(player.id, { reason: 'hazard' });
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
