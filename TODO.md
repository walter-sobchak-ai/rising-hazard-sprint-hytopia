# TODO — Rising Hazard Sprint (Hytopia MVP scaffold)

## 0) Confirm Hytopia SDK project shape (blocking)
- [ ] Confirm language/runtime (TypeScript? JavaScript?)
- [ ] Confirm server entrypoint file + how to register tick/update
- [ ] Confirm entity/component APIs (spawn, physics, triggers, UI)

## 1) Core loop (Day 1)
- [ ] Implement RoundStateMachine using Hytopia scheduler (LOBBY→COUNTDOWN→RUNNING→RESULTS)
- [ ] Player lifecycle
  - [ ] On join: add to round / lobby UI
  - [ ] Late join: spectator until next round
  - [ ] On leave: clean up
- [ ] Map: one simple course with clear sightlines

## 2) Hazards (Day 1)
- [ ] Load `data/hazardSchedule.json` at server start
- [ ] Implement hazards:
  - [ ] `rising_fluid` (kill plane rising at riseRate)
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
