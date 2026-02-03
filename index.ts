// Rising Hazard Sprint — HYTOPIA SDK scaffold
// Mechanics-only prototype: no Roblox IP/branding/assets.

import { PlayerEvent, startServer, World, Player } from 'hytopia';

import { RoundStateMachine } from './src/systems/RoundStateMachine.js';
import { HazardDirector } from './src/systems/HazardDirector.js';
import { RewardsService } from './src/systems/RewardsService.js';
import { QuestsService } from './src/systems/QuestsService.js';

// Optional: if you have a map exported from HYTOPIA world editor, import it like this:
// import worldMap from './assets/map.json' with { type: 'json' };

startServer((world: World) => {
  // TODO(Hytopia): load a real map
  // world.loadMap(worldMap);

  const rewards = new RewardsService();
  const quests = new QuestsService();
  const hazards = new HazardDirector({ schedulePath: 'data/hazardSchedule.json', world });
  const rounds = new RoundStateMachine({ hazards, rewards, quests, world });

  world.on(PlayerEvent.JOINED_WORLD, ({ player }) => onPlayerJoin(rounds, player));
  world.on(PlayerEvent.LEFT_WORLD, ({ player }) => onPlayerLeave(rounds, player));

  void rounds.start();
});

function onPlayerJoin(rounds: RoundStateMachine, player: Player) {
  // TODO(Hytopia): spawn player entity; show UI; add to lobby/queue.
  rounds.onPlayerJoin(player.id);
}

function onPlayerLeave(rounds: RoundStateMachine, player: Player) {
  rounds.onPlayerLeave(player.id);
}
