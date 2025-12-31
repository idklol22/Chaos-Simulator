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

  // Populate dropdown
  ui.system.innerHTML = systems
    .map(s => `<option value="${s.id}">${s.name}</option>`)
    .join("");

  let activeSystemId = systems[0]?.id ?? null;

  function setSystem(id) {
    activeSystemId = id;
    const sys = systems.find(s => s.id === id);
    ui.systemDim.textContent = sys ? `${sys.dim}D` : "—";
    ui.systemInfo.textContent = sys ? `Type: ${sys.kind} • Params: ${Object.keys(sys.params ?? {}).join(", ") || "none"}` : "—";
    ui.eqHint.textContent = sys ? sys.eq : "—";
  }

  ui.system.addEventListener("change", () => setSystem(ui.system.value));
  setSystem(activeSystemId);

  function read() {
    const speed = Number(ui.speed.value);
    const trail = Number(ui.trail.value);
    const dotSize = Number(ui.dotSize.value);
    ui.speedVal.textContent = speed;
    ui.trailVal.textContent = trail;
    ui.dotSizeVal.textContent = dotSize;
    return { speed, trail, dotSize };
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
    const n = Math.max(1, Math.min(15, Math.floor(Number(raw))));
    if (!Number.isFinite(n)) return;
    setArmedSpawn(n);
    ui.spawnBtns.forEach(b => b.classList.remove("primary"));
    ui.spawnMore.classList.add("primary");
  });

  ui.pause.addEventListener("click", () => setPaused(!paused));

  return {
    ui,
    read,
    get paused() { return paused; },
    setPaused,
    get armedSpawnCount() { return armedSpawnCount; },
    clearSelection,
    get activeSystemId() { return activeSystemId; },
    setSystem,
  };
}
