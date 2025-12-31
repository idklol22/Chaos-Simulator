export function makeUI({ systems }) {
  const ui = {
    system: document.getElementById("system"),
    systemDim: document.getElementById("systemDim"),
    systemInfo: document.getElementById("systemInfo"),
    eqHint: document.getElementById("eqHint"),

    speed: document.getElementById("speed"),
    trail: document.getElementById("trail"),
    dotSize: document.getElementById("dotSize"),

    speedVal: document.getElementById("speedVal"),
    trailVal: document.getElementById("trailVal"),
    dotSizeVal: document.getElementById("dotSizeVal"),

    paramSliders: document.getElementById("paramSliders"),

    pause: document.getElementById("pause"),
    clear: document.getElementById("clear"),
    zoomIn: document.getElementById("zoomIn"),

    countText: document.getElementById("countText"),
    spawnStateText: document.getElementById("spawnStateText"),
    camText: document.getElementById("camText"),
    targetText: document.getElementById("targetText"),

    spawnBtns: [...document.querySelectorAll(".spawnBtn")],
    spawnMore: document.getElementById("spawnMore"),
  };

  let paused = false;
  let armedSpawnCount = null;

  ui.system.innerHTML = systems.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  let activeSystemId = systems[0]?.id ?? null;

  // keep live refs to generated sliders
  let paramInputs = {}; // { paramName: HTMLInputElement }

  function fmt(v) {
    // compact numeric display
    const av = Math.abs(v);
    if (av === 0) return "0";
    if (av < 0.001 || av > 10000) return v.toExponential(2);
    return String(Number(v.toFixed(6)));
  }

  function paramRangeDefaults(name, value) {
    // Heuristic min/max so every parameter has its own slider.
    // You can customize per-system later.
    const v = (typeof value === "number") ? value : 0;
    const av = Math.abs(v);

    if (av === 0) return { min: -10, max: 10, step: 0.001 };
    const span = Math.max(1e-6, av * 3); // +/- 3x around value
    const min = v - span;
    const max = v + span;

    // choose step based on magnitude
    const step =
      av >= 10 ? 0.01 :
      av >= 1  ? 0.001 :
      av >= 0.1? 0.0005 :
                0.0001;

    return { min, max, step };
  }

  function buildParamSliders(sys) {
    ui.paramSliders.innerHTML = "";
    paramInputs = {};

    const params = sys?.params ?? {};
    const keys = Object.keys(params);

    if (keys.length === 0) {
      ui.paramSliders.innerHTML = `<div class="sub">No parameters for this system.</div>`;
      return;
    }

    for (const k of keys) {
      const v = params[k];
      if (typeof v !== "number") continue;

      const row = document.createElement("div");
      row.className = "paramRow";

      const nameEl = document.createElement("div");
      nameEl.className = "pname";
      nameEl.textContent = k;

      const slider = document.createElement("input");
      slider.type = "range";

      const { min, max, step } = paramRangeDefaults(k, v);
      slider.min = String(min);
      slider.max = String(max);
      slider.step = String(step);
      slider.value = String(v);

      const valEl = document.createElement("div");
      valEl.className = "pval";
      valEl.textContent = fmt(v);

      slider.addEventListener("input", () => {
        valEl.textContent = fmt(slider.valueAsNumber);
      });

      row.appendChild(nameEl);
      row.appendChild(slider);
      row.appendChild(valEl);

      ui.paramSliders.appendChild(row);
      paramInputs[k] = slider;
    }
  }

  function setSystem(id) {
    activeSystemId = id;
    const sys = systems.find(s => s.id === id);

    ui.systemDim.textContent = sys ? `${sys.dim}D` : "—";
    ui.systemInfo.textContent = sys
      ? `Type: ${sys.kind} • Params: ${Object.keys(sys.params ?? {}).join(", ") || "none"}`
      : "—";

    ui.eqHint.textContent = sys ? sys.eq : "—";

    buildParamSliders(sys);
  }

  ui.system.addEventListener("change", () => setSystem(ui.system.value));
  setSystem(activeSystemId);

  function read() {
    const speed = ui.speed.valueAsNumber;
    const trail = ui.trail.valueAsNumber;
    const dotSize = ui.dotSize.valueAsNumber;

    ui.speedVal.textContent = String(speed);
    ui.trailVal.textContent = String(trail);
    ui.dotSizeVal.textContent = String(dotSize);

    return { speed, trail, dotSize };
  }

  function readParams() {
    const out = {};
    for (const [k, el] of Object.entries(paramInputs)) {
      out[k] = el.valueAsNumber; // numeric slider value [web:595]
    }
    return out;
  }

  function setPaused(p) {
    paused = p;
    ui.pause.textContent = paused ? "Resume" : "Pause";
  }

  function setArmedSpawn(n) {
    armedSpawnCount = n;
    ui.spawnStateText.textContent = (n == null) ? "Spawn: none" : `Spawn: ${n}`;
    for (const b of ui.spawnBtns) b.classList.toggle("primary", Number(b.dataset.n) === n);
    ui.spawnMore.classList.toggle("primary", false);
  }

  function clearSelection() {
    setArmedSpawn(null);
    ui.spawnBtns.forEach(b => b.classList.remove("primary"));
    ui.spawnMore.classList.remove("primary");
  }

  ui.spawnBtns.forEach(btn => btn.addEventListener("click", () => setArmedSpawn(Number(btn.dataset.n))));
  ui.spawnMore.addEventListener("click", () => {
    const raw = prompt("How many to spawn on next click? (1-15)");
    if (raw == null) return;
    const n = Math.max(1, Math.min(50, Math.floor(Number(raw))));
    if (!Number.isFinite(n)) return;
    setArmedSpawn(n);
    ui.spawnBtns.forEach(b => b.classList.remove("primary"));
    ui.spawnMore.classList.add("primary");
  });

  ui.pause.addEventListener("click", () => setPaused(!paused));

  return {
    ui,
    read,
    readParams,
    get paused() { return paused; },
    setPaused,
    get armedSpawnCount() { return armedSpawnCount; },
    clearSelection,
    get activeSystemId() { return activeSystemId; },
  };
}
