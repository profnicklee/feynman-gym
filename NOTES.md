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
1. Select date and workout → location input + Start Workout button appears
2. Tap Start Workout → exercise cards appear, session elapsed timer starts in header
3. Log each set individually with the per-set Log button; a 60s rest timer starts after each set
4. Rest timer: +30s / Skip controls; elapsed rest is accumulated into total_rest_seconds
5. During a session, tap + Add Exercise to append a freeform card (any workout, including Travel Workout)
6. Tap End Workout → session metadata (date, workout, location, start/end time, duration, total rest) posted to workout_sessions tab; summary overlay shown
7. Tap Done on summary → app resets to landing state

## Workout Programmes
- Leg Day: machine-based lower body (5 exercises)
- Push/Pull 1: machine-based upper body (6 exercises)
- Travel Workout: no config exercises — use + Add Exercise for freeform logging
- MED Session: minimum effective dose circuit — Kettlebell Swing (timed), Pushup (reps), Burpee (timed)

## Timed Set Support
Set `"set_type": "timed"` on an exercise in workout-config.json to switch that exercise to timed mode. Timed sets show a Seconds input instead of Reps, store seconds in the reps column, and set weight_kg = 0. Progression suggestion is suppressed for timed exercises. Default behaviour (no set_type key) is reps.

## Freeform Exercise Cards
During an active session, a + Add Exercise button appears at the bottom of the exercise list. Tapping it inserts a freeform card with a free-text exercise name, Reps/Timed toggle, variant input, kg/lbs toggle, 3 set rows, add-set, and notes. Freeform cards can be removed with the ✕ button. If exercise name is empty on Log Set, an inline error is shown. Freeform sets post to the workouts tab under the current session's workout_name.

## Schema Reference

### workouts tab
| Column | Notes |
|---|---|
| logged_at | ISO timestamp (set server-side) |
| date | YYYY-MM-DD |
| workout_name | e.g. "Leg Day", "Travel Workout" |
| exercise_name | From config or freeform text |
| variant | From config select or freeform text |
| set_number | 1-indexed |
| reps | Reps count, or seconds for timed sets |
| weight_kg | Always kg; lbs converted client-side; 0 for timed sets |
| notes | Optional |

### workout_sessions tab
| Column | Notes |
|---|---|
| date | YYYY-MM-DD |
| workout_name | |
| start_time | Local ISO (YYYY-MM-DDTHH:MM:SS) |
| end_time | Local ISO |
| duration_minutes | Decimal, e.g. 47.3 |
| total_rest_seconds | Integer |
| location | Free text, optional |

## Future Enhancements
- FEYNMAN morning brief integration: summarise last session or flag missed workouts via Telegram
- Export/analysis: workouts tab is joinable to RUFUS daily_ratings and morning_checkin by date column
- Add a third workout day when programme expands
