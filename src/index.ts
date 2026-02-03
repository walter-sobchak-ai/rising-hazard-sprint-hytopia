// Rising Hazard Sprint — scaffold entry
// NOTE: Needs wiring to actual Hytopia SDK entrypoints (server/client lifecycle).

import { RoundStateMachine } from './systems/RoundStateMachine.js';
import { HazardDirector } from './systems/HazardDirector.js';
import { RewardsService } from './systems/RewardsService.js';
import { QuestsService } from './systems/QuestsService.js';

export async function startGame() {
  // TODO(Hytopia): replace with real world/server initialization.
  const rewards = new RewardsService();
  const quests = new QuestsService();
  const hazards = new HazardDirector({ schedulePath: 'data/hazardSchedule.json' });

  const rounds = new RoundStateMachine({ hazards, rewards, quests });

  // TODO(Hytopia): wire player join/leave events.
  // rounds.onPlayerJoin(playerId)
  // rounds.onPlayerLeave(playerId)

  await rounds.start();
}
