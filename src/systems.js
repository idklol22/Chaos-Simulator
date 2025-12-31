function rk4Flow(deriv, s, dt, p) {
  const k1 = deriv(s, p);
  const k2 = deriv({ x: s.x + 0.5*dt*k1.dx, y: s.y + 0.5*dt*k1.dy, z: s.z + 0.5*dt*k1.dz }, p);
  const k3 = deriv({ x: s.x + 0.5*dt*k2.dx, y: s.y + 0.5*dt*k2.dy, z: s.z + 0.5*dt*k2.dz }, p);
  const k4 = deriv({ x: s.x + dt*k3.dx,     y: s.y + dt*k3.dy,     z: s.z + dt*k3.dz }, p);
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
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: s.y,
      dy: -p.delta*s.y - p.beta*s.x - p.alpha*(s.x**3) + p.gamma*Math.cos(s.z),
      dz: p.omega
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.duffing.deriv(ss, pp), s, dt, p),
    scale: 8.0,
  },

  // FIXED Thomas: canonical form (sin(y)-b x, sin(z)-b y, sin(x)-b z) [web:552]
    {
    id: "thomas",
    name: "Thomas (MATLAB-like Euler)",
    kind: "flow",
    dim: 3,
    params: { b: 0.208186 },
    eq: "ẋ=sin(y)−bx, ẏ=sin(z)−by, ż=sin(x)−bz (b≈0.208186)",
    init: () => ({ x: (Math.random()*2-1), y: (Math.random()*2-1), z: (Math.random()*2-1) }),
    // Euler step to match your MATLAB code
    step: (s, dt, p) => {
        const dx = Math.sin(s.y) - p.b*s.x;
        const dy = Math.sin(s.z) - p.b*s.y;
        const dz = Math.sin(s.x) - p.b*s.z;
        return { x: s.x + dx*dt, y: s.y + dy*dt, z: s.z + dz*dt };
    },
    // store recommended dt + thinning so main.js can match MATLAB sampling
    preferredDt: 0.005,
    preferredThin: 100,
    scale: 22.0,
    }
,

  // RF: keep equation, adjust defaults to be stable visually
  {
    id: "rf",
    name: "Rabinovich–Fabrikant",
    kind: "flow",
    dim: 3,
    params: { a: 0.14, g: 0.10 },
    eq: "ẋ=yz−y+yx²+γx, ẏ=3xz+x−x³+γy, ż=−2az−2xyz",
    init: () => ({ x: 0.1, y: 0.05, z: 0.0 }),
    deriv: (s, p) => ({
      dx: s.y*s.z - s.y + s.y*(s.x**2) + p.g*s.x,
      dy: 3*s.x*s.z + s.x - (s.x**3) + p.g*s.y,
      dz: -2*p.a*s.z - 2*s.x*s.y*s.z
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.rf.deriv(ss, pp), s, dt, p),
    scale: 6.5,
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

  // replacements (new 3D attractors)

  {
    id: "nosehoover",
    name: "Nose–Hoover",
    kind: "flow",
    dim: 3,
    params: { a: 1.5 },
    eq: "ẋ=y, ẏ=−x+yz, ż=a−y²",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: s.y,
      dy: -s.x + s.y*s.z,
      dz: p.a - s.y*s.y
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.nosehoover.deriv(ss, pp), s, dt, p),
    scale: 10.0,
  },

  {
    id: "rikitake",
    name: "Rikitake Dynamo",
    kind: "flow",
    dim: 3,
    params: { a: 1.0, mu: 0.5 },
    eq: "ẋ=−μx+yz, ẏ=−μy−ax+xz, ż=1−xy",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, p) => ({
      dx: -p.mu*s.x + s.y*s.z,
      dy: -p.mu*s.y - p.a*s.x + s.x*s.z,
      dz: 1 - s.x*s.y
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.rikitake.deriv(ss, pp), s, dt, p),
    scale: 3.0,
  },

  {
    id: "dadras",
    name: "Dadras",
    kind: "flow",
    dim: 3,
    params: { c: 1.7, e: 9.0, o: 2.0, p: 3.0, r: 2.0 },
    eq: "ẋ=y−px+o yz, ẏ=ry−xz+z, ż=cxy−ez",
    init: () => ({ x: 0.1, y: 0.0, z: 0.0 }),
    deriv: (s, P) => ({
      dx: s.y - P.p*s.x + P.o*s.y*s.z,
      dy: P.r*s.y - s.x*s.z + s.z,
      dz: P.c*s.x*s.y - P.e*s.z
    }),
    step: (s, dt, p) => rk4Flow((ss, pp)=>SYSTEMS_BY_ID.dadras.deriv(ss, pp), s, dt, p),
    scale: 1.3,
  },

  // ---------------- 2D MAPS ----------------

  // Hénon map equation is correct. [web:557]
  {
    id: "henon",
    name: "Hénon map",
    kind: "map",
    dim: 2,
    params: { a: 1.4, b: 0.3 },
    eq: "xₙ₊₁=1−a xₙ² + yₙ;  yₙ₊₁=b xₙ",
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
    name: "Logistic map (phase plot)",
    kind: "map",
    dim: 2,
    params: { r: 4.0 },
    eq: "xₙ₊₁=r xₙ(1−xₙ) (rendered as (xₙ, xₙ₊₁))",
    init: () => ({ x: 0.2, y: 0.0, z: 0 }),
    stepMap: (s, p) => {
      const xnext = p.r * s.x * (1 - s.x);
      return clamp2D({ x: s.x, y: xnext, z: 0 });
    },
    scale: 120.0,
  },

  // Switch to canonical Arnold's cat map matrix: (2x+y, x+y) mod 1 [web:546]
  {
    id: "arnoldcat",
    name: "Arnold cat map",
    kind: "map",
    dim: 2,
    params: {},
    eq: "[x';y'] = [[2,1],[1,1]] [x;y] mod 1",
    init: () => ({ x: 0.12, y: 0.34, z: 0 }),
    stepMap: (s) => {
      const x = (2*s.x + s.y) % 1;
      const y = (s.x + s.y) % 1;
      return clamp2D({ x, y, z: 0 });
    },
    scale: 220.0,
  },
];

export const SYSTEMS_BY_ID = Object.fromEntries(SYSTEMS.map(s => [s.id, s]));

for (const sys of SYSTEMS) {
  if (sys.kind === "flow" && typeof sys.step !== "function") {
    sys.step = (s, dt, p) => rk4Flow(sys.deriv, s, dt, p);
  }
}
