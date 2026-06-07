# Feynman Gym

Workout tracker: GitHub Pages frontend → Google Apps Script → RUFUS Google Sheet.

---

## Stack

| Layer | Where |
|---|---|
| UI | GitHub Pages (this repo) |
| API | Google Apps Script Web App (feynman.nicks.agent@gmail.com) |
| Data | Google Sheet `1-ehCEJFXzGXwGorWREUWYHkUiFPUQLc6iqEzKfNWqak`, tab `workouts` |

---

## Deploy: step by step

### 1. Create the Sheet tab

Open the RUFUS sheet. Add a tab named exactly `workouts` (lowercase). Leave it empty — the Apps Script will write the header row on first use.

### 2. Deploy the Apps Script

1. Go to [script.google.com](https://script.google.com) while signed in as **feynman.nicks.agent@gmail.com**.
2. Create a new project. Name it `feynman-gym`.
3. Replace the default `Code.gs` content with the contents of `appsscript/Code.gs` from this repo.
4. Click **Deploy → New deployment**.
5. Set:
   - **Type:** Web app
   - **Execute as:** Me ← required; the script reads/writes the Sheet as this account
   - **Who has access:** Only myself ← required; Google enforces authentication before the script runs
6. Click **Deploy**. Copy the **Web app URL** (looks like `https://script.google.com/macros/s/AKfy.../exec`).

> **Critical:** If you change either "Execute as" or "Who has access", the auth model breaks.  
> - "Execute as: Me" means the script runs as feynman.nicks.agent@gmail.com regardless of caller — this is how it can write to the Sheet.  
> - "Only myself" means Google rejects any request that isn't authenticated as feynman.nicks.agent@gmail.com before the script even runs. `Session.getActiveUser()` inside the script is a secondary check on top of this.  
> - If you redeploy with new code, create a **new deployment version** (Deploy → Manage deployments → edit) — do not create a second deployment.

### 3. Wire the URL into the frontend

Open `index.html`. At the top of the `<script>` block, replace:

```js
const APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```

with the URL from step 2:

```js
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfy.../exec';
```

Commit and push.

### 4. Enable GitHub Pages

In the repo settings → Pages → Source: **Deploy from branch → main → / (root)**. GitHub will publish at `https://<your-username>.github.io/feynman-gym/`.

### 5. Test on Safari (iPhone)

1. Open Safari. Make sure you are signed into the FEYNMAN Google account (check mail.google.com or accounts.google.com — it must be the **active** account, not just a secondary).
2. Navigate to the GitHub Pages URL.
3. Select a workout. The banner should be clear (no errors). If you see "History load failed", open the Apps Script URL directly in Safari once to confirm authentication, then reload the app.

---

## Adding a workout

Add a new key to `workout-config.json` under `"workouts"`. No other changes needed. Old data in the Sheet is untouched.

```json
"Leg Day B": {
  "exercises": [ ... ]
}
```

---

## Schema reference

Tab: `workouts`

| Column | Type | Notes |
|---|---|---|
| `logged_at` | ISO timestamp | Set by Apps Script on receipt |
| `date` | YYYY-MM-DD | User-entered |
| `workout_name` | string | e.g. "Leg Day" |
| `exercise_name` | string | e.g. "Hack Squat" |
| `variant` | string | From config variants list |
| `set_number` | integer | 1-indexed |
| `reps` | integer | |
| `weight_kg` | number | Always kg; lbs converted client-side |
| `notes` | string | Optional |

Joinable to other RUFUS tabs (`daily_ratings`, `morning_checkin`) by the `date` column.

---

## Troubleshooting

**"History load failed" banner**  
Safari isn't authenticated as the FEYNMAN account. Open `https://accounts.google.com` in Safari, confirm the right account is signed in, then reload.

**"Unauthorized" returned from Apps Script**  
The script is running but `Session.getActiveUser().getEmail()` doesn't match `feynman.nicks.agent@gmail.com`. This usually means Safari is signed into a different Google account. Alternatively, the deployment was made from the wrong account.

**Data appears in the Sheet but the app shows old suggestions**  
The history is fetched once at page load. Pull-to-refresh or reload the page to get fresh data.

**Chart is blank / "No data"**  
Normal until you have logged at least one session for that exercise.
