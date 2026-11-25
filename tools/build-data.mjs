// Builds the compact per-region GeoJSON files the game loads at runtime,
// and copies the browser libraries into vendor/.
//
//   npm install && npm run build:data
//
// Sources:
//   countries  Natural Earth 1:50m admin-0 countries via `world-atlas`
//   us-states  US Census states (1:10m) via `us-atlas`
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { geoBounds, geoCircle } from "d3";

const require = createRequire(import.meta.url);
const topojson = require("topojson-client");
const load = (file, object) => {
  const topo = JSON.parse(readFileSync(require.resolve(file), "utf8"));
  return topojson.feature(topo, topo.objects[object]).features;
};

// Countries missing from the 1:50m data, added as small circles so they can
// still be answered and shown (radius in degrees).
const EXTRA_COUNTRIES = [
  { name: "Tuvalu", center: [179.2, -8.5], radius: 0.12 },
];

const worldCountries = [
  ...load("world-atlas/countries-50m.json", "countries"),
  ...EXTRA_COUNTRIES.map(({ name, center, radius }) => ({
    type: "Feature",
    properties: { name },
    geometry: geoCircle().center(center).radius(radius).precision(30)(),
  })),
];

const US_TERRITORIES = new Set([
  "American Samoa", "Commonwealth of the Northern Mariana Islands", "Guam",
  "Puerto Rico", "United States Virgin Islands",
]);
const usStates = load("us-atlas/states-10m.json", "states")
  .filter((f) => !US_TERRITORIES.has(f.properties.name));

// window: every feature whose bounding box touches this lon/lat box is kept,
// so the map has its real neighbours around the playable area.
const REGIONS = {
  europe:   { source: worldCountries, window: [[-32, 27], [62, 82]] },
  africa:   { source: worldCountries, window: [[-30, -40], [64, 40]] },
  asia:     { source: worldCountries, window: [[22, -12], [150, 58]] },
  americas: { source: worldCountries, window: [[-180, -60], [-25, 85]] },
  // Antarctica is left out (its bounding box ends below -58°).
  world:    { source: worldCountries, window: [[-180, -58], [180, 85]], precision: 100 },
  us:       { source: usStates },
};

const roundCoords = (c, k) =>
  typeof c[0] === "number"
    ? [Math.round(c[0] * k) / k, Math.round(c[1] * k) / k]
    : c.map((x) => roundCoords(x, k));

const touches = (f, [[x0, y0], [x1, y1]]) => {
  const [[a, b], [c, d]] = geoBounds(f);
  // a > c means the feature crosses the antimeridian (e.g. Russia, Fiji)
  const lonHit = a > c ? a <= x1 || c >= x0 : a <= x1 && c >= x0;
  return lonHit && b <= y1 && d >= y0;
};

// Drop the parts of a feature that lie entirely outside the window
// (French Guiana in Europe, Hawaii in the Americas, ...).
const trim = (geometry, win) => {
  if (!win || geometry.type !== "MultiPolygon") return geometry;
  const parts = geometry.coordinates.filter((coordinates) =>
    touches({ type: "Polygon", coordinates }, win));
  return parts.length === 1
    ? { type: "Polygon", coordinates: parts[0] }
    : { type: "MultiPolygon", coordinates: parts };
};

mkdirSync("data", { recursive: true });

for (const [id, { source, window: win, precision = 1000 }] of Object.entries(REGIONS)) {
  const features = source
    .filter((f) => !win || touches(f, win))
    .map((f) => {
      const g = trim(f.geometry, win);
      return {
        type: "Feature",
        properties: { name: f.properties.name },
        geometry: { type: g.type, coordinates: roundCoords(g.coordinates, precision) },
      };
    })
    .filter((f) => f.geometry.coordinates.length);
  const out = `data/${id}.json`;
  const json = JSON.stringify({ type: "FeatureCollection", features });
  writeFileSync(out, json);
  console.log(`${out}: ${features.length} features, ${Math.round(json.length / 1024)} KB`);
}

mkdirSync("vendor", { recursive: true });
copyFileSync("node_modules/d3/dist/d3.min.js", "vendor/d3.min.js");
console.log("vendor/d3.min.js copied");
