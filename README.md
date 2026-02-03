# Rising Hazard Sprint (Hytopia Prototype)

Mechanics-first prototype inspired by weekly Roblox Top Trending analysis.

## Goal
Ship a **code skeleton + TODOs** for a 2-minute escalating-hazard survival sprint:
- Round state machine: LOBBY → COUNTDOWN → RUNNING → RESULTS
- HazardDirector: data-driven hazard schedule
- Death → spectate → instant requeue
- Tokens + weekly quests stubs

## Non-goals
- No Roblox IP, branding, assets, or naming.

## What’s in this repo
- `/design/brief.md` — weekly build brief (source-of-truth for this prototype)
- `/data/hazardSchedule.json` — initial hazard timeline
- `/src/` — system stubs (engine-agnostic until we wire to Hytopia SDK)
- `/TODO.md` — task checklist + acceptance criteria

## Open question (needs confirmation)
This scaffold is **SDK-agnostic** until we confirm the current Hytopia project layout + language (TS/JS?) and the exact server/client entrypoints.
