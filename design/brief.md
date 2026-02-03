# Build Brief — Rising Hazard Sprint

**Prototype:** Rising Hazard Sprint (2-minute co-op escape)

## Elevator pitch
A server-based 120s survival sprint: escalating hazards (rising fluid, sweepers, falling tiles). Die → spectate → instant requeue. Earn tokens for cosmetics + weekly quests.

## Game loop
- Lobby (10–20s)
- Run (120s) — hazards escalate every 15–20s
- Results (10s) — rewards + “Play Again”

## Acceptance criteria (target)
1) Time-to-fun ≤ 10s (active server)
2) 120s rounds transition reliably
3) Hazards are server authoritative
4) Death → spectate + requeue; no softlocks
5) Tokens + bestSurvivalMs persist
6) Weekly quests progress + display
7) End → next round ≤ 15s avg
