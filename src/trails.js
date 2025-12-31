export function neonColor(THREE) {
  return new THREE.Color().setHSL(Math.random(), 0.98, 0.62);
}

export function makeNeonTrail({ THREE, scene, maxPoints, color, dotSize }) {
  const positions = new Float32Array(maxPoints * 3);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);

  const mkLine = (opacity, order) => {
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    line.renderOrder = order;
    scene.add(line);
    return line;
  };

  const glowLine = mkLine(0.16, 1);
  const midLine  = mkLine(0.38, 2);
  const coreLine = mkLine(0.92, 3);

  const headGeo = new THREE.BufferGeometry();
  headGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(3), 3));
  const head = new THREE.Points(
    headGeo,
    new THREE.PointsMaterial({
      color,
      size: dotSize * 0.06,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.98,
      depthWrite: false
    })
  );
  head.renderOrder = 4;
  scene.add(head);

  return { positions, geometry, glowLine, midLine, coreLine, head, maxPoints, count: 0 };
}

export function pushPoint(p, v) {
  if (p.count >= p.maxPoints) return;

  const i = p.count * 3;
  p.positions[i + 0] = v.x;
  p.positions[i + 1] = v.y;
  p.positions[i + 2] = v.z;

  p.count += 1;
  p.geometry.attributes.position.needsUpdate = true;

  const headArr = p.head.geometry.attributes.position.array;
  headArr[0] = v.x; headArr[1] = v.y; headArr[2] = v.z;
  p.head.geometry.attributes.position.needsUpdate = true;
}

export function applyTrailWindow(p, trailSlider) {
  const minVisible = 180;
  const maxVisible = p.maxPoints;
  const visible = Math.floor(minVisible + (trailSlider / 100) * (maxVisible - minVisible));

  const start = Math.max(0, p.count - visible);
  const drawCount = Math.max(0, p.count - start);
  p.geometry.setDrawRange(start, drawCount);
}

export function disposeTrail({ scene }, p) {
  scene.remove(p.glowLine);
  scene.remove(p.midLine);
  scene.remove(p.coreLine);
  scene.remove(p.head);
  p.geometry.dispose();
  p.glowLine.material.dispose();
  p.midLine.material.dispose();
  p.coreLine.material.dispose();
  p.head.geometry.dispose();
  p.head.material.dispose();
}
