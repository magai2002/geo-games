/* Geo Games — map quiz engine (prototype).
 *
 * Modes
 *   type   type every country name before time runs out
 *   click  a country is named, click it on the map (3 tries)
 * Styles
 *   bordered    country outlines visible
 *   borderless  only the landmass silhouette; scored separately
 */
(() => {
  "use strict";

  const MAX_TRIES = 3;
  // Places smaller than the region's markerKm2 (Andorra, Malta, Monaco, ...)
  // get a circle marker, since their shape is too small to see or click.
  const KM2_TO_SR = 1 / 6371 ** 2;
  const DEFAULT_MARKER_RADIUS = 6; // px on screen, constant across zoom levels
  const markerRadius = () => S.region.markerRadius || DEFAULT_MARKER_RADIUS;
  const PROJECTIONS = {
    azimuthal: () => d3.geoAzimuthalEqualArea(),
    naturalEarth: () => d3.geoNaturalEarth1(),
    albersUsa: () => d3.geoAlbersUsa(),
  };

  const $ = (id) => document.getElementById(id);
  const el = {
    svg: $("map"), mapWrap: $("mapWrap"), overlay: $("overlay"), menu: $("menu"),
    results: $("results"), hud: $("hud"), score: $("score"), timer: $("timer"),
    prompt: $("prompt"), promptName: $("promptName"), promptTries: $("promptTries"),
    typePanel: $("typePanel"), answer: $("answer"), foundList: $("foundList"),
    progressBar: $("progressBar"), tooltip: $("tooltip"), bestLine: $("bestLine"),
    showResults: $("showResults"),
  };

  // ---------------------------------------------------------------- helpers
  const normalize = (s) =>
    s.normalize("NFD").replace(/[̀-ͯ]/g, "")
      .toLowerCase().replace(/&/g, "and").replace(/^the\s+/, "").replace(/[^a-z]/g, "");

  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const fmtTime = (sec) => {
    sec = Math.max(0, Math.ceil(sec));
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
  };

  const storage = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ } },
  };

  // ------------------------------------------------------------------ state
  const S = {
    region: null,
    features: [],      // all GeoJSON features in the region file
    countries: [],     // playable countries (see buildCountries)
    byFeature: new Map(),
    answers: new Map(),// normalized answer -> country
    mode: "type",
    style: "bordered",
    running: false,
    over: false,
    endsAt: 0,
    timerId: 0,
    startedAt: 0,
    queue: [], current: null, tries: 0,
  };

  // -------------------------------------------------------------------- map
  const svg = d3.select(el.svg);
  const zoomLayer = svg.append("g");
  const coastLayer = zoomLayer.append("g");
  const countryLayer = zoomLayer.append("g");
  const markerLayer = zoomLayer.append("g");
  let projection = d3.geoAzimuthalEqualArea();
  const path = d3.geoPath(projection);
  let zoomK = 1;
  const dataCache = new Map(); // region id -> features

  const zoom = d3.zoom()
    .scaleExtent([1, 40])
    .clickDistance(4)
    .on("start", () => el.svg.classList.add("dragging"))
    .on("end", () => el.svg.classList.remove("dragging"))
    .on("zoom", (e) => {
      zoomK = e.transform.k;
      zoomLayer.attr("transform", e.transform);
      markerLayer.selectAll("circle").attr("r", markerRadius() / zoomK);
      hideTooltip();
    });
  svg.call(zoom).on("dblclick.zoom", null);

  $("zoomIn").onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1.8);
  $("zoomOut").onclick = () => svg.transition().duration(250).call(zoom.scaleBy, 1 / 1.8);
  $("zoomReset").onclick = () => svg.transition().duration(350).call(zoom.transform, d3.zoomIdentity);

  function buildCountries(region, features) {
    const featureByName = new Map(features.map((f) => [f.properties.name, f]));
    S.countries = region.countries.map((c) => {
      const sources = (c.sources || [c.name]).map((n) => {
        const f = featureByName.get(n);
        if (!f) console.warn(`[${region.id}] no map feature named "${n}"`);
        return f;
      }).filter(Boolean);
      return { name: c.name, aliases: c.aliases || [], features: sources, status: null, nodes: [], marker: null };
    });
    S.byFeature.clear();
    S.answers.clear();
    for (const c of S.countries) {
      c.features.forEach((f) => S.byFeature.set(f, c));
      for (const a of [c.name, ...c.aliases]) S.answers.set(normalize(a), c);
    }
  }

  function drawMap() {
    const { width, height } = el.svg.getBoundingClientRect();
    if (!width || !height) return;
    const pad = Math.min(width, height) * 0.03;
    const r = S.region;
    if (r.rotate) projection.rotate(r.rotate);
    projection.fitExtent([[pad, pad], [width - pad, height - pad]],
      r.fit ? { type: "MultiPoint", coordinates: r.fit }
        : { type: "FeatureCollection", features: S.features });

    coastLayer.selectAll("path")
      .data(S.features)
      .join("path")
      .attr("class", "coastline")
      .attr("d", path);

    countryLayer.selectAll("path")
      .data(S.features, (f) => f.properties.name)
      .join("path")
      .attr("d", path)
      .each(function (f) {
        const c = S.byFeature.get(f);
        this.__country = c || null;
        this.setAttribute("class", "country " + (c ? "playable" : "context"));
        if (c && !c.nodes.includes(this)) c.nodes.push(this);
      });

    // Microstates: add a circle marker so they can be seen and clicked.
    const small = S.countries.filter((c) =>
      d3.sum(c.features, (f) => d3.geoArea(f)) < (r.markerKm2 || 0) * KM2_TO_SR);
    S.countries.forEach((c) => (c.marker = null));
    markerLayer.selectAll("circle")
      .data(small, (c) => c.name)
      .join("circle")
      .attr("class", "marker")
      .attr("r", markerRadius() / zoomK)
      .each(function (c) {
        // centroid of the largest part (e.g. Malta's main island)
        // (spherical, so places split by the map's edge, like Kiribati, work)
        const parts = c.features.flatMap((f) => f.geometry.type === "MultiPolygon"
          ? f.geometry.coordinates.map((coordinates) => ({ type: "Polygon", coordinates }))
          : [f.geometry]);
        const main = parts.reduce((a, b) => (d3.geoArea(b) > d3.geoArea(a) ? b : a));
        const [x, y] = projection(d3.geoCentroid(main)) || path.centroid(main);
        this.setAttribute("cx", x);
        this.setAttribute("cy", y);
        this.__country = c;
        c.marker = this;
      });

    paintAll();
  }

  // ---------------------------------------------------------------- painting
  const STATUS_CLASSES = ["s-good", "s-ok", "s-meh", "s-bad"];
  function nodesOf(c) { return c.marker ? [...c.nodes, c.marker] : c.nodes; }

  function paint(c) {
    for (const n of nodesOf(c)) {
      n.classList.remove(...STATUS_CLASSES);
      if (c.status) n.classList.add("s-" + c.status);
      n.classList.toggle("interactive", S.running && S.mode === "click" && !c.status);
    }
  }
  function paintAll() { S.countries.forEach(paint); }

  function pulse(c, cls) {
    for (const n of nodesOf(c)) {
      n.classList.remove(cls);
      void n.getBoundingClientRect(); // restart animation
      n.classList.add(cls);
      n.addEventListener("animationend", () => n.classList.remove(cls), { once: true });
    }
  }

  function setStyle(style) {
    el.mapWrap.classList.toggle("bordered", style === "bordered");
    el.mapWrap.classList.toggle("borderless", style === "borderless");
  }

  // ---------------------------------------------------------------- tooltip
  function showTooltip(evt, text) {
    const r = el.mapWrap.getBoundingClientRect();
    el.tooltip.textContent = text;
    el.tooltip.style.left = `${evt.clientX - r.left}px`;
    el.tooltip.style.top = `${evt.clientY - r.top}px`;
    el.tooltip.hidden = false;
  }
  function hideTooltip() { el.tooltip.hidden = true; }

  el.svg.addEventListener("pointermove", (evt) => {
    const c = evt.target.__country;
    // Names are shown only where they don't give the answer away.
    if (c && (S.over || (S.mode === "type" && c.status))) showTooltip(evt, c.name);
    else hideTooltip();
  });
  el.svg.addEventListener("pointerleave", hideTooltip);

  // ------------------------------------------------------------------ input
  svg.on("click", (evt) => {
    if (!S.running || S.mode !== "click") return;
    const target = evt.target;
    if (!target.classList.contains("country") && !target.classList.contains("marker")) return; // sea
    onMapGuess(target.__country);
  });

  el.answer.addEventListener("input", () => {
    if (!S.running || S.mode !== "type") return;
    const c = S.answers.get(normalize(el.answer.value));
    if (c && !c.status) {
      c.status = "good";
      paint(c);
      el.answer.value = "";
      el.answer.classList.add("hit");
      setTimeout(() => el.answer.classList.remove("hit"), 250);
      renderList();
      updateScore();
      if (S.countries.every((x) => x.status)) endGame("complete");
    }
  });

  // ------------------------------------------------------------ click mode
  function nextTarget() {
    S.current = S.queue.shift() || null;
    if (!S.current) return endGame("complete");
    S.tries = S.current.tries || 0; // a skipped place keeps its misses
    el.promptName.textContent = S.current.name;
    renderTries();
    $("skipBtn").disabled = S.queue.length === 0;
  }

  // Skip: the current place goes to the back of the queue and comes back
  // after all the others.
  function skipTarget() {
    if (!S.running || S.mode !== "click" || !S.current || !S.queue.length) return;
    S.current.tries = S.tries;
    S.queue.push(S.current);
    nextTarget();
  }
  $("skipBtn").onclick = (e) => { e.currentTarget.blur(); skipTarget(); };
  document.addEventListener("keydown", (e) => {
    if (e.key !== " " || !S.running || S.mode !== "click" || e.repeat) return;
    e.preventDefault();
    skipTarget();
  });

  function renderTries() {
    el.promptTries.textContent = "✕".repeat(S.tries);
  }

  function onMapGuess(c) {
    if (c && c.status) return; // already resolved, ignore
    const target = S.current;
    if (c === target) {
      target.status = ["good", "ok", "meh"][S.tries];
      paint(target);
      updateScore();
      return nextTarget();
    }
    S.tries++;
    if (c) pulse(c, "wrong");
    renderTries();
    if (S.tries >= MAX_TRIES) {
      target.status = "bad";
      paint(target);
      pulse(target, "flash");
      updateScore();
      nextTarget();
    }
  }

  // -------------------------------------------------------------- game flow
  const bestKey = () => `geo:${S.region.id}:${S.mode}:${S.style}`;

  function correctCount() {
    return S.countries.filter((c) => c.status && c.status !== "bad").length;
  }

  function updateScore() {
    const n = correctCount(), total = S.countries.length;
    el.score.textContent = `${n}/${total}`;
    el.progressBar.style.width = `${(100 * n) / total}%`;
  }

  function renderList() {
    const byName = new Map(S.countries.map((c) => [c.name, c]));
    const groups = S.region.groups
      ? Object.entries(S.region.groups).map(([title, names]) => [title, names.map((n) => byName.get(n))])
      : [[null, S.countries]];
    const items = [];
    for (const [title, list] of groups) {
      if (title) {
        const h = document.createElement("li");
        h.className = "group";
        const found = list.filter((c) => c.status === "good").length;
        h.textContent = `${title} · ${found}/${list.length}`;
        items.push(h);
      }
      const sorted = [...list].sort((a, b) => a.name.localeCompare(b.name));
      for (const c of sorted) {
        const li = document.createElement("li");
        if (c.status === "good") { li.textContent = c.name; li.className = "found"; }
        else if (S.over) { li.textContent = c.name; li.className = "missed"; }
        items.push(li);
      }
    }
    el.foundList.classList.toggle("grouped", !!S.region.groups);
    el.foundList.replaceChildren(...items);
  }

  function tick() {
    const left = (S.endsAt - performance.now()) / 1000;
    el.timer.textContent = fmtTime(left);
    el.timer.classList.toggle("low", left <= 30);
    if (left <= 0) endGame("timeout");
  }

  function startGame() {
    S.mode = document.querySelector('input[name="mode"]:checked').value;
    S.style = document.querySelector('input[name="style"]:checked').value;
    S.countries.forEach((c) => (c.status = null));
    S.over = false;
    S.running = true;
    setStyle(S.style);
    svg.call(zoom.transform, d3.zoomIdentity);

    el.overlay.hidden = true;
    el.showResults.hidden = true;
    el.hud.hidden = false;
    el.typePanel.hidden = S.mode !== "type";
    el.prompt.hidden = S.mode !== "click";
    // The side panel changes the map's size, so re-fit before playing.
    requestAnimationFrame(drawMap);

    if (S.mode === "type") {
      el.answer.value = "";
      el.answer.disabled = false;
      renderList();
      setTimeout(() => el.answer.focus(), 0);
    } else {
      S.countries.forEach((c) => (c.tries = 0));
      S.queue = shuffle([...S.countries]);
      nextTarget();
    }

    updateScore();
    paintAll();
    const limit = S.region.timeLimits[S.mode];
    S.startedAt = performance.now();
    S.endsAt = S.startedAt + limit * 1000;
    clearInterval(S.timerId);
    S.timerId = setInterval(tick, 200);
    tick();
  }

  function endGame(reason) {
    if (!S.running) return;
    S.running = false;
    S.over = true;
    clearInterval(S.timerId);
    const elapsed = (performance.now() - S.startedAt) / 1000;

    // Reveal everything not answered.
    S.countries.forEach((c) => { if (!c.status) c.status = "bad"; });
    paintAll();
    el.answer.disabled = true;
    el.prompt.hidden = true;
    if (S.mode === "type") renderList();

    const n = correctCount(), total = S.countries.length;
    const firstTry = S.countries.filter((c) => c.status === "good").length;
    const pct = Math.round((100 * n) / total);

    $("resultTitle").textContent =
      reason === "complete" ? (n === total ? "Perfect!" : "Finished!")
        : reason === "timeout" ? "Time's up!" : "Quiz over";
    $("resultScore").textContent = `${n}/${total} · ${pct}%`;
    $("resultDetail").textContent =
      (S.mode === "click" ? `${firstTry} on the first try. ` : "") + `Time: ${fmtTime(elapsed)}`;

    const prev = storage.get(bestKey());
    const better = !prev || n > prev.score || (n === prev.score && elapsed < prev.time);
    if (better) storage.set(bestKey(), { score: n, total, time: elapsed });
    $("resultBest").textContent = better
      ? (prev ? "New personal best!" : "First score saved.")
      : `Your best: ${prev.score}/${prev.total} in ${fmtTime(prev.time)}`;

    const missed = S.countries.filter((c) => c.status === "bad").map((c) => c.name).sort();
    $("missedWrap").hidden = missed.length === 0;
    $("missedList").textContent = missed.join(", ");

    showOverlay("results");
  }

  function showOverlay(which) {
    el.overlay.hidden = false;
    el.menu.hidden = which !== "menu";
    el.results.hidden = which !== "results";
    el.showResults.hidden = true;
    if (which === "menu") {
      el.hud.hidden = true;
      el.prompt.hidden = true;
      el.typePanel.hidden = true;
      S.over = false;
      S.countries.forEach((c) => (c.status = null));
      paintAll();
      updateBestLine();
      requestAnimationFrame(drawMap);
    }
  }

  function updateBestLine() {
    if (!S.region) return;
    const mode = document.querySelector('input[name="mode"]:checked').value;
    const style = document.querySelector('input[name="style"]:checked').value;
    setStyle(style); // preview the map style behind the menu
    const b = storage.get(`geo:${S.region.id}:${mode}:${style}`);
    el.bestLine.textContent = b ? `Your best: ${b.score}/${b.total} in ${fmtTime(b.time)}` : "";
  }

  $("startBtn").onclick = startGame;
  $("againBtn").onclick = startGame;
  $("menuBtn").onclick = () => showOverlay("menu");
  $("giveUp").onclick = () => endGame("giveup");
  $("viewMapBtn").onclick = () => { el.overlay.hidden = true; el.showResults.hidden = false; };
  el.showResults.onclick = () => showOverlay("results");
  document.querySelectorAll('input[name="mode"], input[name="style"]')
    .forEach((i) => i.addEventListener("change", updateBestLine));

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawMap, 120);
  });

  // ----------------------------------------------------------------- regions
  const LAST_REGION_KEY = "geo:lastRegion";

  function renderRegionChoices() {
    el.regionChoices = $("regionChoices");
    el.regionChoices.replaceChildren(...Object.values(window.REGIONS).map((r) => {
      const label = document.createElement("label");
      label.className = "chip";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "region";
      input.value = r.id;
      input.addEventListener("change", () => selectRegion(r.id).catch(console.error));
      const span = document.createElement("span");
      span.textContent = r.short;
      label.append(input, span);
      return label;
    }));
  }

  let loadSeq = 0;
  async function selectRegion(regionId) {
    const region = window.REGIONS[regionId] || window.REGIONS.europe;
    const seq = ++loadSeq;
    const radio = document.querySelector(`input[name="region"][value="${region.id}"]`);
    if (radio) radio.checked = true;
    $("startBtn").disabled = true;
    if (!dataCache.has(region.id)) {
      const res = await fetch(region.data);
      if (!res.ok) throw new Error(`${region.data}: HTTP ${res.status}`);
      dataCache.set(region.id, (await res.json()).features);
    }
    if (seq !== loadSeq) return; // another region was picked meanwhile
    storage.set(LAST_REGION_KEY, region.id);

    S.region = region;
    S.features = dataCache.get(region.id);
    projection = PROJECTIONS[region.projection || "azimuthal"]();
    path.projection(projection);
    buildCountries(region, S.features);
    svg.call(zoom.transform, d3.zoomIdentity);

    // Menu texts and the modes this region offers.
    const noun = region.noun === "States" ? "state" : "country";
    $("regionTitle").textContent = region.title;
    $("typeDesc").textContent = `Type every ${noun} before time runs out.`;
    $("clickDesc").textContent = `We name a ${noun}, you click it. 3 tries each.`;
    $("answerLabel").textContent = `Enter ${noun}:`;
    el.answer.placeholder = `e.g. ${region.countries[0].name}`;
    const clickOk = region.modes.includes("click");
    const clickInput = document.querySelector('input[name="mode"][value="click"]');
    clickInput.disabled = !clickOk;
    $("clickChoice").classList.toggle("disabled", !clickOk);
    if (!clickOk && clickInput.checked) {
      document.querySelector('input[name="mode"][value="type"]').checked = true;
    }
    $("startBtn").disabled = false;
    showOverlay("menu");
  }

  // ------------------------------------------------------------------- boot
  renderRegionChoices();
  selectRegion(storage.get(LAST_REGION_KEY) || "europe").catch((err) => {
    console.error(err);
    el.menu.innerHTML = `<h1>Couldn't load the map</h1>
      <p class="muted">Serve this folder over HTTP (e.g. <code>npm run serve</code>) instead of opening the file directly.</p>`;
  });
})();
