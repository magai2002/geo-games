# Geo Games

Sporcle-style, timed geography map quizzes in the browser. Prototype: **Countries of Europe** (45 countries).

## Quizzes

| Mode | How it works | Time |
|---|---|---|
| **Name them all** | Type country names; correct answers are accepted instantly and fill in on the map. Common alternatives work (`UK`, `Czech Republic`, `Holland`, `Bosnia`, `Vatican`…). | 8:00 |
| **Find on the map** | A country is named; click it. 3 tries per country: green = 1st try, yellow = 2nd, orange = 3rd, red = missed (the right one flashes). | 5:00 |

Each mode can be played on a **bordered** map or a **borderless** map (just the coastline silhouette — the hard variant, with its own best score). Microstates (Vatican, Monaco, San Marino, Liechtenstein, Andorra, Malta) get circle markers; on the borderless map the markers are invisible but still clickable. Scroll/pinch to zoom, drag to pan.

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
js/regions.js       region config: playable countries, aliases, projection, time limits
js/game.js          quiz engine (rendering, zoom, modes, timer, scoring)
data/europe.json    pre-built GeoJSON for the region (generated)
vendor/d3.min.js    D3 v7 (generated copy)
tools/build-data.mjs  regenerates data/ and vendor/ from npm packages
```

Map data: [Natural Earth](https://www.naturalearthdata.com/) 1:50m via [`world-atlas`](https://github.com/topojson/world-atlas) (public domain).

## Adding a region

1. Add a lon/lat window to `REGIONS` in `tools/build-data.mjs`, then `npm install && npm run build:data`.
2. Add an entry to `js/regions.js` with the playable countries (feature names come from the generated file; use `sources` when names differ or a country is made of several features, `aliases` for alternative answers).
3. Point `boot()` at it (a region picker is the next step).
