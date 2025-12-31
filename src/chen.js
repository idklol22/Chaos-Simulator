export const SYS = { alpha: 5.0, beta: -10.0, delta: -0.38 };

export function deriv({ x, y, z }, p = SYS) {
  return {
    dx: p.alpha * x - y * z,
    dy: p.beta  * y + x * z,
    dz: p.delta * z + (1 / 3) * x * y
  };
}

export function rk4(s, dt) {
  const k1 = deriv(s);
  const k2 = deriv({ x: s.x + 0.5 * dt * k1.dx, y: s.y + 0.5 * dt * k1.dy, z: s.z + 0.5 * dt * k1.dz });
  const k3 = deriv({ x: s.x + 0.5 * dt * k2.dx, y: s.y + 0.5 * dt * k2.dy, z: s.z + 0.5 * dt * k2.dz });
  const k4 = deriv({ x: s.x + dt * k3.dx,       y: s.y + dt * k3.dy,       z: s.z + dt * k3.dz });
  return {
    x: s.x + (dt / 6) * (k1.dx + 2 * k2.dx + 2 * k3.dx + k4.dx),
    y: s.y + (dt / 6) * (k1.dy + 2 * k2.dy + 2 * k3.dy + k4.dy),
    z: s.z + (dt / 6) * (k1.dz + 2 * k2.dz + 2 * k3.dz + k4.dz),
  };
}
