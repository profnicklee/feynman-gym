# Feynman Gym — Notes & Next Steps

## Current Status
Live at https://profnicklee.github.io/feynman-gym
Apps Script Web App: deployed from feynman.nicks.agent@gmail.com, Execute as Me, Anyone.
Data: "workouts" tab (per-set rows) and "workout_sessions" tab (session metadata) in RUFUS Google Sheet.
Auth: shared secret token (FEYNMAN_GYM_2026) in APPS_SCRIPT_URL fetch and Code.gs.

## Known Issues
- Deprecated meta tag: replace `apple-mobile-web-app-capable` with `mobile-web-app-capable` in index.html

## Architecture Decisions
- Token auth chosen over Google session auth — Safari ITP blocks credentialled cross-origin fetches from GitHub Pages regardless of account state
- Apps Script deployed as "Anyone" (not "Only myself") — required for CORS to work without session cookies
- No OpenClaw dependency by design — single point of failure avoided
- workout-config.json loaded at runtime, not inlined — config changes require no code edits

## Adding a New Workout
Add a new key to `workout-config.json` following the existing pattern. Old data in the Sheet is untouched and remains queryable by workout_name.

## Session Flow (current UX)
1. Select date and workout → Start Workout button appears
2. Tap Start Workout → exercise cards appear, session elapsed timer starts in header
3. Log each set individually with the per-set Log button; a 60s rest timer starts after each set
4. Rest timer: +30s / Skip controls; elapsed rest is accumulated into total_rest_seconds
5. Tap End Workout → session metadata (date, workout, start/end time, duration, total rest) posted to workout_sessions tab; summary overlay shown
6. Tap Done on summary → app resets to landing state

## Future Enhancements
- FEYNMAN morning brief integration: summarise last session or flag missed workouts via Telegram
- Export/analysis: workouts tab is joinable to RUFUS daily_ratings and morning_checkin by date column
- Add a third workout day when programme expands
