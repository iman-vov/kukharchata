// Кухарчата — генератор кухонь: з опису (форма, що потрібно) будує ASCII-сітку.
// Детермінований: на всіх пристроях виходить однакова кухня.

export function genKitchen(spec) {
  const W = spec.w || 15, H = spec.h || 9;
  const g = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (x === 0 || y === 0 || x === W - 1 || y === H - 1) ? '#' : '.'));
  const gates = [];
  const mx = Math.floor(W / 2), my = Math.floor(H / 2);
  // внутрішні перешкоди
  switch (spec.layout) {
    case 'island': for (let y = my - 1; y <= my; y++) for (let x = mx - 2; x <= mx + 2; x++) g[y][x] = '#'; break;
    case 'columns': for (const cx of [Math.floor(W / 3), W - 1 - Math.floor(W / 3)]) for (let y = 2; y <= H - 3; y++) if (y !== my) g[y][cx] = '#'; break;
    case 'ring': for (let y = 3; y <= H - 4; y++) for (let x = 4; x <= W - 5; x++) g[y][x] = '#'; break;
    case 'conv': {
      const y1 = my - 1, y2 = my;
      for (let x = 3; x <= W - 5; x++) { g[y1][x] = '>'; g[y2][x + 1] = '<'; }
      g[y1][W - 4] = 'v'; g[y2][3] = '^';
      break;
    }
    case 'split': {
      for (let y = 1; y <= H - 2; y++) g[y][mx] = '#';
      const b1 = 2, b2 = H - 3; g[b1][mx] = '.'; g[b2][mx] = '.';
      if (spec.gates) { gates.push({ at: [[mx, b1]], period: 16, closed: 6 }, { at: [[mx, b2]], period: 16, closed: 6, offset: 8 }); }
      if (spec.convBridge) { g[my][mx] = '>'; g[my][mx - 1] = '>'; g[my][mx + 1] = '>'; }
      break;
    }
    case 'lanes': {
      for (let x = 2; x <= W - 3; x++) { if (x !== 4 && x !== W - 5) g[3][x] = '#'; if (x !== mx) g[H - 4][x] = '#'; }
      if (spec.gates) gates.push({ at: [[4, 3], [W - 5, 3]], period: 14, closed: 5 }, { at: [[mx, H - 4]], period: 18, closed: 6, offset: 7 });
      break;
    }
    case 'islands2': {
      for (const [cx, cy] of [[4, 3], [W - 5, 3], [4, H - 4], [W - 5, H - 4]]) { g[cy][cx] = '#'; g[cy][cx + (cx < mx ? 1 : -1)] = '#'; }
      g[my][mx] = '#'; g[my][mx - 1] = '#'; g[my][mx + 1] = '#';
      break;
    }
  }
  // вільні місця на периметрі (з виходом на підлогу), по зонах
  const isFloor = (x, y) => g[y] && g[y][x] === '.';
  const edge = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y][x] !== '#') continue;
    if (!(x === 0 || y === 0 || x === W - 1 || y === H - 1)) continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isFloor(x + dx, y + dy))) edge.push([x, y]);
  }
  const top = edge.filter(([x, y]) => y === 0).sort((a, b) => a[0] - b[0]);
  const left = edge.filter(([x, y]) => x === 0).sort((a, b) => a[1] - b[1]);
  const right = edge.filter(([x, y]) => x === W - 1).sort((a, b) => a[1] - b[1]);
  const bottom = edge.filter(([x, y]) => y === H - 1).sort((a, b) => a[0] - b[0]);
  const used = new Set();
  const put = (list, ch, every = 2, from = 0) => {
    for (let i = from; i < list.length; i++) {
      const [x, y] = list[i]; const k = x + ',' + y;
      if (used.has(k)) continue;
      // через одну, щоб лишалися вільні стійки поруч
      if (every > 1 && list.slice(Math.max(0, i - 1), i).some(([a, b]) => used.has(a + ',' + b) && g[b][a] !== '#')) continue;
      used.add(k); g[y][x] = ch; return true;
    }
    return false;
  };
  // видача — праворуч угорі
  const tr = top.slice().reverse();
  for (let i = 0, n = 0; i < tr.length && n < 2; i++) { const [x, y] = tr[i]; if (x >= W - 2) continue; used.add(x + ',' + y); g[y][x] = 'D'; n++; }
  // плити й печі — уздовж верху зліва
  const cook = [...Array(spec.pots || 0).fill('S'), ...Array(spec.pans || 0).fill('F'), ...Array(spec.ovens || 0).fill('O')];
  for (const ch of cook) if (!put(top, ch, 2, 1)) if (!put(bottom, ch, 2, 3)) put(right, ch);
  // тарілки, мийка, дошки — праворуч
  put(right, 'P', 1);
  if (spec.wash) put(right, 'W', 2);
  const boards = spec.boards ?? 2;
  for (let i = 0; i < boards; i++) if (!put(right, 'C', 2)) put(bottom, 'C', 2, 4);
  // ящики — ліворуч, далі по низу
  const crates = spec.crates || [];
  const map = {};
  crates.forEach((ing, i) => { const ch = String(i + 1); map[ch] = ing; if (!put(left, ch, 1)) put(bottom, ch, 1, 1); });
  // смітник і вогнегасник — внизу
  put(bottom, 'T', 2, Math.floor(bottom.length / 2));
  if (spec.fire) put(bottom, 'E', 2, Math.floor(bottom.length * 0.7));
  if (spec.extraBoard) put(bottom, 'C', 2, 2);
  // точки старту
  const sp = [[2, 2], [W - 3, 2], [3, H - 3], [W - 4, H - 3]];
  for (const [x, y] of sp) if (g[y][x] === '.') g[y][x] = '@';
  return { grid: g.map(r => r.join('')), crates: map, gates: gates.length ? gates : undefined };
}
