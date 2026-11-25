// Region definitions. Adding a region = add an entry here + a window in
// tools/build-data.mjs, then `npm run build:data`.
//
// countries: the playable set.
//   name     display name (also accepted as an answer)
//   sources  feature names in data/<id>.json that make up this country
//            (defaults to [name])
//   aliases  other accepted answers
// Every other feature in the data file is drawn as non-playable context.
window.REGIONS = {
  europe: {
    id: "europe",
    name: "Europe",
    data: "data/europe.json",
    // Projection: centred on Europe, fitted to this lon/lat box.
    rotate: [-14, -52],
    fit: [[-24, 34], [14, 33.5], [44, 36], [44, 71], [-24, 71], [10, 72]],
    timeLimits: { type: 8 * 60, click: 5 * 60 },
    countries: [
      { name: "Albania" },
      { name: "Andorra" },
      { name: "Austria" },
      { name: "Belarus" },
      { name: "Belgium" },
      { name: "Bosnia and Herzegovina", sources: ["Bosnia and Herz."], aliases: ["Bosnia", "Bosnia Herzegovina", "BiH"] },
      { name: "Bulgaria" },
      { name: "Croatia" },
      { name: "Czechia", aliases: ["Czech Republic"] },
      { name: "Denmark" },
      { name: "Estonia" },
      { name: "Finland", sources: ["Finland", "Åland"] },
      { name: "France" },
      { name: "Germany" },
      { name: "Greece" },
      { name: "Hungary" },
      { name: "Iceland" },
      { name: "Ireland", aliases: ["Republic of Ireland", "Eire"] },
      { name: "Italy" },
      { name: "Kosovo" },
      { name: "Latvia" },
      { name: "Liechtenstein" },
      { name: "Lithuania" },
      { name: "Luxembourg" },
      { name: "Malta" },
      { name: "Moldova" },
      { name: "Monaco" },
      { name: "Montenegro" },
      { name: "Netherlands", aliases: ["Holland", "The Netherlands"] },
      { name: "North Macedonia", sources: ["Macedonia"], aliases: ["Macedonia"] },
      { name: "Norway" },
      { name: "Poland" },
      { name: "Portugal" },
      { name: "Romania" },
      { name: "Russia", aliases: ["Russian Federation"] },
      { name: "San Marino" },
      { name: "Serbia" },
      { name: "Slovakia" },
      { name: "Slovenia" },
      { name: "Spain" },
      { name: "Sweden" },
      { name: "Switzerland" },
      { name: "Ukraine" },
      { name: "United Kingdom", aliases: ["UK", "Great Britain", "Britain", "England"] },
      { name: "Vatican City", sources: ["Vatican"], aliases: ["Vatican", "Holy See"] },
    ],
  },
};
