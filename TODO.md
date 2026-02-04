# TODO — Rising Hazard Sprint (Hytopia MVP scaffold)

## 0) Confirm Hytopia SDK project shape (blocking)
- [ ] Confirm language/runtime (TypeScript? JavaScript?)
- [ ] Confirm server entrypoint file + how to register tick/update
- [ ] Confirm entity/component APIs (spawn, physics, triggers, UI)

## 1) Core loop (Day 1)
- [x] Implement RoundStateMachine skeleton (LOBBY→COUNTDOWN→RUNNING→RESULTS)
- [x] Player join spawns DefaultPlayerEntity
- [ ] Late join: spectator until next round (not in MVP yet)
- [ ] Map: replace generated flat floor with real exported map

## 2) Hazards (Day 1)
- [x] Load `data/hazardSchedule.json` at server start
- [x] MVP hazard: `rising_fluid` implemented as a rising kill-height
  - [ ] `sweeper` (rotating arm w/ knockback)
  - [ ] `falling_tiles` (tiles fall after step / delay)
  - [ ] (optional) `wind_gust`
- [ ] Ensure server-authoritative damage/elimination

## 3) Death / spectate / requeue (Day 1)
- [ ] On death: mark eliminated, switch to spectate camera
- [ ] Requeue button always available
- [ ] No long walkbacks; no softlocks

## 4) Rewards + persistence stubs (Day 1–2)
- [ ] Token reward calc (participation + survival milestones + streak)
- [ ] Persist: tokens + bestSurvivalMs

## 5) Weekly quests (Day 2)
- [ ] 3 quests:
  - [ ] Survive X seconds
  - [ ] Play N rounds
  - [ ] Finish once
- [ ] WeekKey reset logic

## 6) UI (Day 2)
- [ ] Lobby: big Play CTA + quests panel + “New this week” changelog stub
- [ ] HUD: timer bar + hazard level + requeue
- [ ] Results: survival time, tokens, quest progress ticks, Play Again default-focused

## Acceptance criteria
- [ ] Time-to-fun ≤ 10s (active server)
- [ ] 120s rounds transition reliably
- [ ] Hazards spawn on schedule; server authoritative
- [ ] Death → spectate + requeue; no softlocks
- [ ] Tokens + bestSurvivalMs persist
- [ ] Weekly quests progress + display
- [ ] End → next round ≤ 15s avg
