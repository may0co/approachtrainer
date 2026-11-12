# Approach Trip Trainer

A climbing training tracker: a 13-week block of board sessions, endurance and lifting that retunes itself to the area you are headed for, with a session logger, daily check-in, progress charts, tick lists and trip prep.

One static page, no build server. Data is saved in the browser by default.

## Run it

Open `index.html`, or serve the folder with GitHub Pages (Settings → Pages → Deploy from a branch → `main`, `/ (root)`).

## Change it

Edit the files in `src/`, then run `python3 build.py` to regenerate `index.html`.

- `src/areas.js` area ratings, tick lists and trip notes
- `src/program.js` the 13-week block
- `src/core.js` storage, plan engine, statistics
- `src/views.js` screens
- `src/events.js` interactions
- `src/style.css` styles

## Data

Everything lives in the browser's local storage. The Data screen exports and imports a JSON backup. `*.json` files are ignored by git so a backup is never committed by accident.

Optional sync: create a Supabase project, run `supabase/schema.sql`, and fill in `config.js`. This path has not been tested against a live project.
