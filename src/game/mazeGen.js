function mulberry32(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const MAZE_CELL = 3;
export const MAZE_WALL_H = 3;

export function generateMaze(size = 11, seed = 20261025) {
  const random = mulberry32(seed);
  const grid = [];
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push({ r, c, n: true, e: true, s: true, w: true, visited: false, room: null });
    }
    grid.push(row);
  }

  const stack = [];
  let current = grid[0][0];
  current.visited = true;
  let visited = 1;
  const total = size * size;
  const dirs = [
    ["n", -1, 0, "s"],
    ["e", 0, 1, "w"],
    ["s", 1, 0, "n"],
    ["w", 0, -1, "e"],
  ];

  while (visited < total) {
    const options = [];
    for (const [dir, dr, dc, opposite] of dirs) {
      const nr = current.r + dr;
      const nc = current.c + dc;
      if (nr >= 0 && nr < size && nc >= 0 && nc < size && !grid[nr][nc].visited) {
        options.push([dir, nr, nc, opposite]);
      }
    }
    if (options.length) {
      const [dir, nr, nc, opposite] = options[Math.floor(random() * options.length)];
      const next = grid[nr][nc];
      current[dir] = false;
      next[opposite] = false;
      stack.push(current);
      current = next;
      current.visited = true;
      visited++;
    } else if (stack.length) {
      current = stack.pop();
    }
  }

  const center = (size - 1) / 2;
  const cellToWorld = (c, r) => ({
    x: (c - center) * MAZE_CELL,
    z: (r - center) * MAZE_CELL,
  });
  const worldToCell = (x, z) => ({
    c: Math.round(x / MAZE_CELL + center),
    r: Math.round(z / MAZE_CELL + center),
  });

  const distances = new Map();
  const queue = [{ r: 0, c: 0, d: 0 }];
  distances.set("0,0", 0);
  const dirList = [
    ["n", -1, 0],
    ["e", 0, 1],
    ["s", 1, 0],
    ["w", 0, -1],
  ];
  while (queue.length) {
    const item = queue.shift();
    for (const [dir, dr, dc] of dirList) {
      if (grid[item.r][item.c][dir]) continue;
      const nr = item.r + dr;
      const nc = item.c + dc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      const key = `${nr},${nc}`;
      if (distances.has(key)) continue;
      distances.set(key, item.d + 1);
      queue.push({ r: nr, c: nc, d: item.d + 1 });
    }
  }

  const exitCell = grid[size - 1][size - 1];
  const exitDist = distances.get(`${size - 1},${size - 1}`) || 0;
  exitCell.exit = true;
  exitCell.exitDistance = exitDist;

  const deadEnds = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      const walls = [cell.n, cell.e, cell.s, cell.w].filter(Boolean).length;
      if (walls === 3 && !(r === 0 && c === 0) && !(r === size - 1 && c === size - 1)) {
        deadEnds.push({ cell, dist: distances.get(`${r},${c}`) || 0 });
      }
    }
  }
  deadEnds.sort((a, b) => b.dist - a.dist);
  const roomTypes = ["bedroom", "library", "kitchen", "bathroom", "toyroom"];
  const rooms = [];
  deadEnds.slice(0, 5).forEach((entry, i) => {
    entry.cell.room = roomTypes[i % roomTypes.length];
    rooms.push({ type: entry.cell.room, r: entry.cell.r, c: entry.cell.c });
  });
  if (!rooms.find((room) => room.type === "library")) {
    const fallback = deadEnds[5] || deadEnds[0];
    if (fallback) {
      fallback.cell.room = "library";
      rooms.push({ type: "library", r: fallback.cell.r, c: fallback.cell.c });
    }
  }

  const keyRooms = ["bedroom", "library", "kitchen"];
  const keys = keyRooms.map((type, index) => {
    let room = rooms.find((r) => r.type === type);
    if (!room) {
      const candidate = deadEnds[(index + 1) % Math.max(1, deadEnds.length)];
      if (candidate) {
        candidate.cell.room = type;
        room = { type, r: candidate.cell.r, c: candidate.cell.c };
        rooms.push(room);
      }
    }
    if (!room) room = { type, r: size - 1, c: Math.max(0, size - 2 - index) };
    return { ...room, id: index, collected: false };
  });

  const hidingCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c].room || (r === 0 && c === 0) || (r === size - 1 && c === size - 1)) continue;
      if (distances.get(`${r},${c}`) > 5) hidingCells.push({ r, c });
    }
  }
  const hidingSpots = hidingCells
    .filter((_, i) => i % Math.max(1, Math.floor(hidingCells.length / 7)) === 0)
    .slice(0, 7)
    .map(({ r, c }, i) => ({ r, c, type: i % 2 === 0 ? "wardrobe" : "bed" }));

  const wallTextCells = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r + c) % 3 === 0 && !(r === 0 && c === 0)) wallTextCells.push({ r, c });
    }
  }

  const wallSegments = [];
  const half = MAZE_CELL / 2;
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const cell = grid[r][c];
      const { x, z } = cellToWorld(c, r);
      if (cell.n) wallSegments.push({ x, z: z - half, horizontal: true });
      if (cell.w) wallSegments.push({ x: x - half, z, horizontal: false });
      if (c === size - 1 && cell.e) wallSegments.push({ x: x + half, z, horizontal: false });
      if (r === size - 1 && cell.s) wallSegments.push({ x, z: z + half, horizontal: true });
    }
  }

  const wallAABBs = wallSegments.map((wall) => {
    const hx = wall.horizontal ? half + 0.15 : 0.15;
    const hz = wall.horizontal ? 0.15 : half + 0.15;
    return {
      minX: wall.x - hx,
      maxX: wall.x + hx,
      minZ: wall.z - hz,
      maxZ: wall.z + hz,
    };
  });

  function canMove(x, z, radius = 0.34) {
    for (const box of wallAABBs) {
      if (
        x + radius > box.minX &&
        x - radius < box.maxX &&
        z + radius > box.minZ &&
        z - radius < box.maxZ
      ) {
        return false;
      }
    }
    return true;
  }

  function hasLineOfSight(ax, az, bx, bz) {
    const steps = Math.max(8, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.18));
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      for (const box of wallAABBs) {
        if (x > box.minX - 0.02 && x < box.maxX + 0.02 && z > box.minZ - 0.02 && z < box.maxZ + 0.02) {
          return false;
        }
      }
    }
    return true;
  }

  return {
    size,
    seed,
    grid,
    rooms,
    keys,
    hidingSpots,
    wallTextCells,
    wallSegments,
    wallAABBs,
    cellToWorld,
    worldToCell,
    canMove,
    hasLineOfSight,
    start: { r: 0, c: 0 },
    exit: { r: size - 1, c: size - 1 },
    distance: (r, c) => distances.get(`${r},${c}`) || 0,
  };
}
