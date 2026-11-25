// Region definitions. Adding a region = add an entry to REGIONS below + a
// window in tools/build-data.mjs, then `npm run build:data`.
//
// A playable place is written as
//   "Name"                                   feature name in the data file
//   ["Name", { sources, aliases }]
//     sources  feature names in data/<id>.json that make up this place
//              (defaults to [Name])
//     aliases  other accepted answers
// "Saint X" names also accept "St X" automatically.
// Every other feature in the data file is drawn as non-playable context.
(() => {
  // ------------------------------------------------- countries by continent
  const EUROPE = [
    "Albania", "Andorra", "Austria", "Belarus", "Belgium",
    ["Bosnia and Herzegovina", { sources: ["Bosnia and Herz."], aliases: ["Bosnia", "Bosnia Herzegovina", "BiH"] }],
    "Bulgaria", "Croatia",
    ["Czechia", { aliases: ["Czech Republic"] }],
    "Denmark", "Estonia",
    ["Finland", { sources: ["Finland", "Åland"] }],
    "France", "Germany", "Greece", "Hungary", "Iceland",
    ["Ireland", { aliases: ["Republic of Ireland", "Eire"] }],
    "Italy", "Kosovo", "Latvia", "Liechtenstein", "Lithuania", "Luxembourg",
    "Malta", "Moldova", "Monaco", "Montenegro",
    ["Netherlands", { aliases: ["Holland"] }],
    ["North Macedonia", { sources: ["Macedonia"], aliases: ["Macedonia"] }],
    "Norway", "Poland", "Portugal", "Romania",
    ["Russia", { aliases: ["Russian Federation"] }],
    "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden",
    "Switzerland", "Ukraine",
    ["United Kingdom", { aliases: ["UK", "Great Britain", "Britain", "England"] }],
    ["Vatican City", { sources: ["Vatican"], aliases: ["Vatican", "Holy See"] }],
  ];

  const AFRICA = [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi",
    ["Cabo Verde", { aliases: ["Cape Verde"] }],
    "Cameroon",
    ["Central African Republic", { sources: ["Central African Rep."], aliases: ["CAR"] }],
    "Chad", "Comoros",
    ["Democratic Republic of the Congo", { sources: ["Dem. Rep. Congo"],
      aliases: ["DR Congo", "DRC", "Congo-Kinshasa", "Congo Kinshasa", "Zaire"] }],
    ["Republic of the Congo", { sources: ["Congo"], aliases: ["Congo", "Congo-Brazzaville", "Congo Brazzaville"] }],
    ["Côte d'Ivoire", { aliases: ["Ivory Coast"] }],
    "Djibouti", "Egypt",
    ["Equatorial Guinea", { sources: ["Eq. Guinea"] }],
    "Eritrea",
    ["Eswatini", { sources: ["eSwatini"], aliases: ["Swaziland"] }],
    "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau",
    "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", "Malawi", "Mali",
    "Mauritania", "Mauritius", "Morocco", "Mozambique", "Namibia", "Niger",
    "Nigeria", "Rwanda",
    ["São Tomé and Príncipe", { sources: ["São Tomé and Principe"], aliases: ["Sao Tome"] }],
    "Senegal", "Seychelles", "Sierra Leone",
    ["Somalia", { sources: ["Somalia", "Somaliland"] }],
    "South Africa",
    ["South Sudan", { sources: ["S. Sudan"] }],
    "Sudan", "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  ];

  const ASIA = [
    "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan",
    ["Brunei", { aliases: ["Brunei Darussalam"] }],
    "Cambodia",
    ["China", { sources: ["China", "Hong Kong", "Macao"], aliases: ["PRC", "People's Republic of China"] }],
    ["Cyprus", { sources: ["Cyprus", "N. Cyprus"] }],
    "Georgia", "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan",
    "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan",
    ["Laos", { aliases: ["Lao"] }],
    "Lebanon", "Malaysia", "Maldives", "Mongolia",
    ["Myanmar", { aliases: ["Burma"] }],
    "Nepal",
    ["North Korea", { aliases: ["DPRK"] }],
    "Oman", "Pakistan",
    ["Palestine", { aliases: ["State of Palestine", "Palestinian Territories"] }],
    "Philippines", "Qatar", "Saudi Arabia", "Singapore",
    ["South Korea", { aliases: ["Republic of Korea"] }],
    "Sri Lanka", "Syria",
    ["Taiwan", { aliases: ["Chinese Taipei"] }],
    "Tajikistan", "Thailand",
    ["Timor-Leste", { aliases: ["East Timor"] }],
    ["Turkey", { aliases: ["Türkiye"] }],
    "Turkmenistan",
    ["United Arab Emirates", { aliases: ["UAE", "Emirates"] }],
    "Uzbekistan",
    ["Vietnam", { aliases: ["Viet Nam"] }],
    "Yemen",
  ];

  const AMERICAS = [
    ["Antigua and Barbuda", { sources: ["Antigua and Barb."] }],
    "Argentina", "Bahamas", "Barbados", "Belize", "Bolivia", "Brazil",
    "Canada", "Chile", "Colombia", "Costa Rica", "Cuba", "Dominica",
    ["Dominican Republic", { sources: ["Dominican Rep."] }],
    "Ecuador", "El Salvador", "Grenada", "Guatemala", "Guyana", "Haiti",
    "Honduras", "Jamaica", "Mexico", "Nicaragua", "Panama", "Paraguay", "Peru",
    ["Saint Kitts and Nevis", { sources: ["St. Kitts and Nevis"], aliases: ["Saint Kitts", "St Kitts"] }],
    "Saint Lucia",
    ["Saint Vincent and the Grenadines", { sources: ["St. Vin. and Gren."], aliases: ["Saint Vincent", "St Vincent"] }],
    "Suriname",
    ["Trinidad and Tobago", { aliases: ["Trinidad"] }],
    ["United States", { sources: ["United States of America"],
      aliases: ["United States of America", "USA", "US", "America"] }],
    "Uruguay", "Venezuela",
  ];

  const OCEANIA = [
    "Australia", "Fiji", "Kiribati",
    ["Marshall Islands", { sources: ["Marshall Is."] }],
    ["Micronesia", { aliases: ["Federated States of Micronesia", "FSM"] }],
    "Nauru", "New Zealand", "Palau",
    ["Papua New Guinea", { aliases: ["PNG"] }],
    "Samoa",
    ["Solomon Islands", { sources: ["Solomon Is."] }],
    "Tonga", "Tuvalu", "Vanuatu",
  ];

  const US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina",
    "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Washington", "West Virginia", "Wisconsin", "Wyoming",
  ];

  // ---------------------------------------------------------------- regions
  // projection  "azimuthal" (default, uses rotate), "naturalEarth", "albersUsa"
  // fit         lon/lat points the map is fitted to; default: all features
  // modes       quiz modes offered (default: both)
  // markerKm2   places smaller than this get a circle marker
  // groups      optional headings for the answer list (name -> places)
  const R = {
    europe: {
      name: "Europe", noun: "Countries",
      rotate: [-14, -52],
      fit: [[-24, 34], [14, 33.5], [44, 36], [44, 71], [-24, 71], [10, 72]],
      timeLimits: { type: 8 * 60, click: 5 * 60 },
      markerKm2: 1000,
      countries: EUROPE,
    },
    africa: {
      name: "Africa", noun: "Countries",
      rotate: [-17, -2],
      fit: [[-25.5, 17], [-17, 37.5], [33, 37.5], [52, 12], [58, -20], [32, -35], [18, -35]],
      timeLimits: { type: 8 * 60, click: 6 * 60 },
      markerKm2: 5000,
      countries: AFRICA,
    },
    asia: {
      name: "Asia", noun: "Countries",
      rotate: [-88, -28],
      fit: [[26, 41], [40, 43], [60, 55], [87, 50], [120, 53], [146, 46], [128, -10], [95, 5], [73, -1], [52, 12]],
      timeLimits: { type: 8 * 60, click: 6 * 60 },
      markerKm2: 7000,
      countries: ASIA,
    },
    americas: {
      name: "the Americas", short: "Americas", noun: "Countries",
      rotate: [90, -15],
      fit: [[-168, 66], [-125, 70], [-85, 82], [-62, 82], [-52, 47], [-35, -7], [-68, -55], [-82, -5], [-110, 22]],
      timeLimits: { type: 6 * 60 },
      modes: ["type"],
      markerKm2: 1000,
      countries: AMERICAS,
    },
    world: {
      name: "the World", short: "World", noun: "Countries",
      projection: "naturalEarth",
      rotate: [-10, 0],
      timeLimits: { type: 15 * 60 },
      modes: ["type"],
      markerKm2: 4000, markerRadius: 4,
      groups: { Europe: EUROPE, Asia: ASIA, Africa: AFRICA, Americas: AMERICAS, Oceania: OCEANIA },
      countries: [...EUROPE, ...ASIA, ...AFRICA, ...AMERICAS, ...OCEANIA],
    },
    us: {
      name: "the US", short: "US States", title: "US States",
      projection: "albersUsa",
      timeLimits: { type: 8 * 60, click: 5 * 60 },
      markerKm2: 7000,
      countries: US_STATES,
    },
  };

  // Normalize entries to { name, sources, aliases }.
  const entry = (e) => {
    const [name, opts = {}] = Array.isArray(e) ? e : [e];
    const aliases = [...(opts.aliases || [])];
    for (const a of [name, ...aliases]) {
      if (/^Saint /.test(a)) aliases.push(a.replace(/^Saint /, "St "));
    }
    return { name, sources: opts.sources || [name], aliases };
  };
  for (const [id, r] of Object.entries(R)) {
    r.id = id;
    r.data = `data/${id}.json`;
    r.short = r.short || r.name;
    r.title = r.title || `${r.noun} of ${r.name}`;
    r.modes = r.modes || ["type", "click"];
    r.countries = r.countries.map(entry);
    if (r.groups) {
      for (const g of Object.keys(r.groups)) r.groups[g] = r.groups[g].map((e) => entry(e).name);
    }
  }
  window.REGIONS = R;
})();
