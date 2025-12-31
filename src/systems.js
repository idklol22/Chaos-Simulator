// Unified interface:
//
// Flow (ODE): step(state, dt) -> newState
// Map (discrete): step(state) -> newState
//
// Each system also provides:
// - name, dim (2 or 3), kind ("flow" | "map")
// - params, eq (short string)
// - init(): initial state (object)

function rk4Flow(deriv, s, dt, p) {
  const k1 = deriv(s, p);
  const k2 = deriv({ x: s.x + 0.5*dt*k1.dx, y: s.y + 0.5*dt*k1.dy, z: s.z + 0.5*dt*k1.dz }, p);
  const k3 = deriv({ x: s.x + 0.5*dt*k2.dx, y: s.y + 0.5*dt*k2.dy, z: s.z + 0.5*dt*k2.dz }, p);
  const k4 = deriv({ x: s.x + dt*k3.dx, y: s.y + dt*k3.dy, z: s.z + dt*k3.dz }, p);
  return {
    x: s.x + (dt/6)*(k1.dx + 2*k2.dx + 2*k3.dx + k4.dx),
    y: s.y + (dt/6)*(k1.dy + 2*k2.dy + 2*k3.dy + k4.dy),
    z: s.z + (dt/6)*(k1.dz + 2*k2.dz + 2*k3.dz + k4.dz),
  };
}

function clamp2D(s) {
  return { x: s.x, y: s.y, z: 0 };
}

export const SYSTEMS = [
  // ---------------- 3D FLOWS ----------------

  {
    id: "lorenz",
    name: "Lorenz",
    kind: "flow",
    dim: 3,
    params: { sigma: 10, rho: 28, beta: 8/3 },
    eq: "ẋ=σ(y−x), ẏ=x(ρ−z)−y, ż=xy−βz",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: p.sigma * (s.y - s.x),
      dy: s.x * (p.rho - s.z) - s.y,
      dz: s.x * s.y - p.beta * s.z
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.lorenz.deriv(ss, pp), s, dt, p),
    scale: 2.2,
  },

  {
    id: "chen",
    name: "Chen (Lorenz-like)",
    kind: "flow",
    dim: 3,
    params: { a: 35, b: 3, c: 28 },
    eq: "ẋ=a(y−x), ẏ=(c−a)x−xz+cy, ż=xy−bz",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: p.a * (s.y - s.x),
      dy: (p.c - p.a) * s.x - s.x * s.z + p.c * s.y,
      dz: s.x * s.y - p.b * s.z
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.chen.deriv(ss, pp), s, dt, p),
    scale: 1.9,
  },

  {
    id: "chenlee",
    name: "Chen–Lee",
    kind: "flow",
    dim: 3,
    params: { a: 5.0, b: -10.0, c: -0.38 },
    eq: "ẋ=ax−yz, ẏ=by+xz, ż=cz+(1/3)xy",
    init: () => ({ x: 0.01, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: p.a * s.x - s.y * s.z,
      dy: p.b * s.y + s.x * s.z,
      dz: p.c * s.z + (1/3) * s.x * s.y
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.chenlee.deriv(ss, pp), s, dt, p),
    scale: 1.8,
  },

  {
    id: "rossler",
    name: "Rössler",
    kind: "flow",
    dim: 3,
    params: { a: 0.2, b: 0.2, c: 5.7 },
    eq: "ẋ=−(y+z), ẏ=x+ay, ż=b+z(x−c)",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: -(s.y + s.z),
      dy: s.x + p.a * s.y,
      dz: p.b + s.z * (s.x - p.c)
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.rossler.deriv(ss, pp), s, dt, p),
    scale: 6.0,
  },

  {
    id: "chua",
    name: "Chua",
    kind: "flow",
    dim: 3,
    params: { alpha: 15.6, beta: 28.0, m0: -1.143, m1: -0.714 },
    eq: "ẋ=α(y−x−h(x)), ẏ=x−y+z, ż=−βy",
    init: () => ({ x: 0.2, y: 0.0, z: 0.0 }),
    deriv: (s, p) => {
      const hx = p.m1*s.x + 0.5*(p.m0 - p.m1) * (Math.abs(s.x + 1) - Math.abs(s.x - 1));
      return {
        dx: p.alpha * (s.y - s.x - hx),
        dy: s.x - s.y + s.z,
        dz: -p.beta * s.y
      };
    },
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.chua.deriv(ss, pp), s, dt, p),
    scale: 2.4,
  },

  {
    id: "duffing",
    name: "Duffing (forced)",
    kind: "flow",
    dim: 3,
    params: { alpha: 1, beta: -1, delta: 0.2, gamma: 0.3, omega: 1.2 },
    eq: "ẋ=y, ẏ=−δy−βx−αx³+γcos(θ), θ̇=ω",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }), // z is θ
    deriv: (s, p) => ({
      dx: s.y,
      dy: -p.delta*s.y - p.beta*s.x - p.alpha*(s.x**3) + p.gamma*Math.cos(s.z),
      dz: p.omega
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.duffing.deriv(ss, pp), s, dt, p),
    scale: 8.0,
  },

  {
    id: "thomas",
    name: "Thomas",
    kind: "flow",
    dim: 3,
    params: { a: 0.2, b: 4.0 },
    eq: "ẋ=−ax+b sin(y), ẏ=−ay+b sin(z), ż=−az+b sin(x)",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: -p.a * s.x + p.b * Math.sin(s.y),
      dy: -p.a * s.y + p.b * Math.sin(s.z),
      dz: -p.a * s.z + p.b * Math.sin(s.x),
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.thomas.deriv(ss, pp), s, dt, p),
    scale: 12.0,
  },

  {
    id: "aizawa",
    name: "Aizawa",
    kind: "flow",
    dim: 3,
    params: { a: 0.95, b: 0.7, c: 0.6, d: 3.5, e: 0.25, f: 0.1 },
    eq: "Aizawa (standard form)",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: (s.z - p.b) * s.x - p.d * s.y,
      dy: p.d * s.x + (s.z - p.b) * s.y,
      dz: p.c + p.a*s.z - (s.z**3)/3 - (s.x**2 + s.y**2) * (1 + p.e*s.z) + p.f*s.z*(s.x**3),
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.aizawa.deriv(ss, pp), s, dt, p),
    scale: 4.2,
  },

  {
    id: "halvorsen",
    name: "Halvorsen",
    kind: "flow",
    dim: 3,
    params: { a: 1.4, b: 1.0 },
    eq: "ẋ=−ax−by−bz−y², ẏ=−ay−bz−bx−z², ż=−az−bx−by−x²",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: -p.a*s.x - p.b*s.y - p.b*s.z - s.y*s.y,
      dy: -p.a*s.y - p.b*s.z - p.b*s.x - s.z*s.z,
      dz: -p.a*s.z - p.b*s.x - p.b*s.y - s.x*s.x,
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.halvorsen.deriv(ss, pp), s, dt, p),
    scale: 2.2,
  },

  {
    id: "rf",
    name: "Rabinovich–Fabrikant",
    kind: "flow",
    dim: 3,
    params: { a: 0.14, g: 0.10 },
    eq: "ẋ=yz−y+yx²+γx, ẏ=3xz+x−x³+γy, ż=−2az−2xyz",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: s.y*s.z - s.y + s.y*(s.x**2) + p.g*s.x,
      dy: 3*s.x*s.z + s.x - (s.x**3) + p.g*s.y,
      dz: -2*p.a*s.z - 2*s.x*s.y*s.z
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.rf.deriv(ss, pp), s, dt, p),
    scale: 10.0,
  },

  {
    id: "qichen",
    name: "Qi–Chen",
    kind: "flow",
    dim: 3,
    params: { a: 35, b: 3, c: 28 },
    eq: "ẋ=a(y−x)+yz, ẏ=cx+y−xz, ż=xy−bz",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: p.a*(s.y - s.x) + s.y*s.z,
      dy: p.c*s.x + s.y - s.x*s.z,
      dz: s.x*s.y - p.b*s.z
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.qichen.deriv(ss, pp), s, dt, p),
    scale: 2.2,
  },

  {
    id: "burkeshaw",
    name: "Burke–Shaw",
    kind: "flow",
    dim: 3,
    params: { e: 0.0, n: 10.0 },
    eq: "ẋ=−n(x+y), ẏ=y−nxz, ż=nxy+e",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: -p.n*(s.x + s.y),
      dy: s.y - p.n*s.x*s.z,
      dz: p.n*s.x*s.y + p.e
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.burkeshaw.deriv(ss, pp), s, dt, p),
    scale: 2.0,
  },

  {
    id: "arneodo",
    name: "Arneodo",
    kind: "flow",
    dim: 3,
    params: { a: 5.5, b: 3.5, c: 1.0, d: -1.0 },
    eq: "ẋ=y, ẏ=z, ż=−ax−by−cz+dx³",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: s.y,
      dy: s.z,
      dz: -p.a*s.x - p.b*s.y - p.c*s.z + p.d*(s.x**3)
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.arneodo.deriv(ss, pp), s, dt, p),
    scale: 2.5,
  },

  {
    id: "rucklidge",
    name: "Rucklidge",
    kind: "flow",
    dim: 3,
    params: { a: 2.0, b: 6.7 },
    eq: "ẋ=−ax+by−yz, ẏ=x, ż=−z+y²",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: -p.a*s.x + p.b*s.y - s.y*s.z,
      dy: s.x,
      dz: -s.z + s.y*s.y
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.rucklidge.deriv(ss, pp), s, dt, p),
    scale: 2.2,
  },

  // ---------------- 2D MAPS ----------------

  {
    id: "henon",
    name: "Hénon map",
    kind: "map",
    dim: 2,
    params: { a: 1.4, b: 0.3 },
    eq: "xₙ₊₁ = 1 − a xₙ² + yₙ;  yₙ₊₁ = b xₙ",
    init: () => ({ x: 0.1, y: 0.1, z: 0 }),
    stepMap: (s, p) => clamp2D({
      x: 1 - p.a*(s.x**2) + s.y,
      y: p.b*s.x,
      z: 0
    }),
    scale: 55.0,
  },

  {
    id: "logistic",
    name: "Logistic map",
    kind: "map",
    dim: 2, // visualized as (x_n, x_{n+1})
    params: { r: 4.0 },
    eq: "xₙ₊₁ = r xₙ(1−xₙ) (render as (xₙ, xₙ₊₁))",
    init: () => ({ x: 0.2, y: 0.0, z: 0 }),
    stepMap: (s, p) => {
      const xnext = p.r * s.x * (1 - s.x);
      return clamp2D({ x: s.x, y: xnext, z: 0 });
    },
    scale: 120.0,
  },

  {
    id: "arnoldcat",
    name: "Arnold cat map",
    kind: "map",
    dim: 2,
    params: { },
    eq: "[x';y'] = [[1,1],[1,2]] [x;y] mod 1",
    init: () => ({ x: 0.12, y: 0.34, z: 0 }),
    stepMap: (s) => {
      const x = (s.x + s.y) % 1;
      const y = (s.x + 2*s.y) % 1;
      return clamp2D({ x, y, z: 0 });
    },
    scale: 220.0,
  },
];

export const SYSTEMS_BY_ID = Object.fromEntries(SYSTEMS.map(s => [s.id, s]));

// Ensure flow systems have a .step
for (const sys of SYSTEMS) {
  if (sys.kind === "flow" && typeof sys.step !== "function") {
    sys.step = (s, dt, p) => rk4Flow(sys.deriv, s, dt, p);
  }
}
