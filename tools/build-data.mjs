// Builds the compact per-region GeoJSON files the game loads at runtime,
// and copies the browser libraries into vendor/.
//
//   npm install && npm run build:data
//
// Source: Natural Earth 1:50m admin-0 countries via the `world-atlas` package.
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { geoBounds } from "d3";

const require = createRequire(import.meta.url);
const topojson = require("topojson-client");
const topo = JSON.parse(
  readFileSync(require.resolve("world-atlas/countries-50m.json"), "utf8")
);

// Every country whose bounding box touches this lon/lat window is kept, so
// the map has its real neighbours around the playable area.
const REGIONS = {
  europe: { window: [[-32, 27], [62, 82]] },
};

const round = (x) => Math.round(x * 1000) / 1000; // ~100 m precision
const roundCoords = (c) =>
  typeof c[0] === "number" ? [round(c[0]), round(c[1])] : c.map(roundCoords);

const all = topojson.feature(topo, topo.objects.countries).features;

const touches = (f, [[x0, y0], [x1, y1]]) => {
  const [[a, b], [c, d]] = geoBounds(f);
  // a > c means the feature crosses the antimeridian (e.g. Russia, Fiji)
  const lonHit = a > c ? a <= x1 || c >= x0 : a <= x1 && c >= x0;
  return lonHit && b <= y1 && d >= y0;
};

// Drop the parts of a country that lie entirely outside the window
// (French Guiana, Réunion, Caribbean Netherlands, ...).
const trim = (geometry, win) => {
  if (geometry.type !== "MultiPolygon") return geometry;
  const parts = geometry.coordinates.filter((coordinates) =>
    touches({ type: "Polygon", coordinates }, win));
  return parts.length === 1
    ? { type: "Polygon", coordinates: parts[0] }
    : { type: "MultiPolygon", coordinates: parts };
};
mkdirSync("data", { recursive: true });

for (const [id, { window: win }] of Object.entries(REGIONS)) {
  const features = all
    .filter((f) => touches(f, win))
    .map((f) => {
      const g = trim(f.geometry, win);
      return {
        type: "Feature",
        properties: { name: f.properties.name },
        geometry: { type: g.type, coordinates: roundCoords(g.coordinates) },
      };
    });
  const out = `data/${id}.json`;
  writeFileSync(out, JSON.stringify({ type: "FeatureCollection", features }));
  console.log(`${out}: ${features.length} features`);
}

mkdirSync("vendor", { recursive: true });
copyFileSync("node_modules/d3/dist/d3.min.js", "vendor/d3.min.js");
console.log("vendor/d3.min.js copied");
