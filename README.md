# Geo Games

Sporcle-style, timed geography map quizzes in the browser.

| Region | Places | Name them all | Find on the map |
|---|---|---|---|
| Europe | 45 countries | 8:00 | 5:00 |
| Africa | 54 countries | 8:00 | 6:00 |
| Asia | 49 countries | 8:00 | 6:00 |
| Americas | 35 countries | 6:00 | — |
| World | 197 countries (answer list grouped by continent) | 15:00 | — |
| US States | 50 states | 8:00 | 5:00 |

The World quiz uses the UN's 193 members plus Vatican City, Palestine, Kosovo and Taiwan, i.e. exactly the union of the five continent lists. Russia is counted in Europe, and Turkey, Cyprus and the Caucasus in Asia.

## Quizzes

| Mode | How it works | Time |
|---|---|---|
| **Name them all** | Type names; correct answers are accepted instantly and fill in on the map. Common alternatives work (`UK`, `Czech Republic`, `Ivory Coast`, `Burma`, `UAE`, `St Lucia`…). | see above |
| **Find on the map** | A place is named; click it. 3 tries each: green = 1st try, yellow = 2nd, orange = 3rd, red = missed (the right one flashes). | see above |

Each mode can be played on a **bordered** map or a **borderless** map (just the coastline silhouette — the hard variant, with its own best score). Places too small to click (microstates, small island nations, Rhode Island, Delaware…) get circle markers — the size cut-off is set per region; on the borderless map the markers are invisible but still clickable. Scroll/pinch to zoom, drag to pan.

Best scores are kept in the browser (`localStorage`) per region × mode × map style.

## Running it

It's a static site with no build step — but it loads the map with `fetch`, so it must be served over HTTP:

```sh
python3 -m http.server 8080   # or: npm run serve
# open http://localhost:8080
```

Works as-is on GitHub Pages.

## Layout

```
index.html          page + overlays
css/style.css       styles (light/dark)
js/regions.js       region config: playable places, aliases, projection, time limits, modes
js/game.js          quiz engine (rendering, zoom, modes, timer, scoring)
data/<region>.json  pre-built GeoJSON per region (generated)
vendor/d3.min.js    D3 v7 (generated copy)
tools/build-data.mjs  regenerates data/ and vendor/ from npm packages
```

Map data: [Natural Earth](https://www.naturalearthdata.com/) 1:50m via [`world-atlas`](https://github.com/topojson/world-atlas) (public domain); US states from the US Census Bureau via [`us-atlas`](https://github.com/topojson/us-atlas). Tuvalu is missing from the 1:50m data and is added as a small circle at build time.

## Adding a region

1. Add a lon/lat window to `REGIONS` in `tools/build-data.mjs`, then `npm install && npm run build:data`.
2. Add an entry to `js/regions.js` with the playable places (feature names come from the generated file; use `sources` when names differ or a place is made of several features, `aliases` for alternative answers). It appears in the region picker automatically.
