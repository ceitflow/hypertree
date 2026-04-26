import { GraphNodeBase } from '../../models/base';

type LayoutState = {
  x: number[];
  y: number[];
  vx: number[];
  vy: number[];
  radius: number[];
  parentIndex: number[];
  depth: number[];
  clusterRoot: GraphNodeBase[];
};

export type ClusteredForceLayoutOptions = {
  iterations?: number;
  width?: number;
  height?: number;
  nodeRadius?: number;
  damping?: number;
  alpha?: number;
  alphaDecay?: number;
  centerStrength?: number;
  chargeStrength?: number;
  clusterStrength?: number;
  linkStrength?: number;
  linkDistance?: number;
  collisionPadding?: number;
};

const DEFAULTS: Required<ClusteredForceLayoutOptions> = {
  iterations: 300,
  width: 2000,
  height: 1200,
  nodeRadius: 12,
  damping: 0.9,
  alpha: 1,
  alphaDecay: 0.018,
  centerStrength: 0.025,
  chargeStrength: 1200,
  clusterStrength: 0.2,
  linkStrength: 0.08,
  linkDistance: 80,
  collisionPadding: 4
};

export function clusteredForceLayout(
  nodes: GraphNodeBase[],
  options: ClusteredForceLayoutOptions = {}
): GraphNodeBase[] {
  const cfg = { ...DEFAULTS, ...options };
  if (nodes.length === 0) {
    return nodes;
  }

  const state = buildLayoutState(nodes, cfg.nodeRadius);
  initializePositions(nodes, state.x, state.y, state.depth);
  const clusterCenters = new Map<GraphNodeBase, { x: number; y: number }>();
  const centerX = cfg.width / 2;
  const centerY = cfg.height / 2;

  let alpha = cfg.alpha;
  for (let i = 0; i < cfg.iterations; i++) {
    updateClusterCenters(state, clusterCenters);
    applyCenterForce(state, centerX, centerY, cfg.centerStrength * alpha);
    applyChargeForce(state, cfg.chargeStrength * alpha);
    applyLinkForce(state, cfg.linkStrength * alpha, cfg.linkDistance);
    applyClusterForce(state, clusterCenters, cfg.clusterStrength * alpha);
    applyCollisions(state, cfg.collisionPadding);
    integrate(state, cfg.damping);
    alpha *= 1 - cfg.alphaDecay;
  }

  for (let i = 0; i < nodes.length; i++) {
    nodes[i].bbox.x = state.x[i];
    nodes[i].bbox.y = state.y[i];
  }
  return nodes;
}

function buildLayoutState(nodes: GraphNodeBase[], defaultRadius: number): LayoutState {
  const nodeSet = new Set(nodes);
  const indexByNode = new Map<GraphNodeBase, number>();
  const length = nodes.length;
  const x = new Array<number>(length);
  const y = new Array<number>(length);
  const vx = new Array<number>(length).fill(0);
  const vy = new Array<number>(length).fill(0);
  const radius = new Array<number>(length);
  const parentIndex = new Array<number>(length).fill(-1);
  const depth = new Array<number>(length);
  const clusterRoot = new Array<GraphNodeBase>(length);

  for (let i = 0; i < length; i++) {
    const node = nodes[i];
    indexByNode.set(node, i);
    x[i] = node.bbox.x;
    y[i] = node.bbox.y;
    radius[i] = node.radius ?? defaultRadius;
  }

  for (let i = 0; i < length; i++) {
    const node = nodes[i];
    const parent = resolveParent(node, nodeSet);
    if (parent) {
      parentIndex[i] = indexByNode.get(parent) ?? -1;
    }
    depth[i] = getDepth(node, nodeSet);
    clusterRoot[i] = getClusterRoot(node, nodeSet);
  }

  return { x, y, vx, vy, radius, parentIndex, depth, clusterRoot };
}

function resolveParent(node: GraphNodeBase, nodeSet: Set<GraphNodeBase>): GraphNodeBase | undefined {
  const parent = node.parent;
  if (!parent || !nodeSet.has(parent)) {
    return undefined;
  }
  return parent;
}

function getDepth(node: GraphNodeBase, nodeSet: Set<GraphNodeBase>): number {
  let depth = 0;
  let cursor = resolveParent(node, nodeSet);
  while (cursor) {
    depth += 1;
    cursor = resolveParent(cursor, nodeSet);
  }
  return depth;
}

function getClusterRoot(node: GraphNodeBase, nodeSet: Set<GraphNodeBase>): GraphNodeBase {
  let cursor = node;
  let parent = resolveParent(cursor, nodeSet);
  while (parent) {
    const grandParent = resolveParent(parent, nodeSet);
    if (!grandParent) {
      return cursor;
    }
    cursor = parent;
    parent = grandParent;
  }
  return node;
}

function initializePositions(nodes: GraphNodeBase[], x: number[], y: number[], depth: number[]): void {
  // Deterministic circular seeding keeps simulation stable.
  const byDepth = new Map<number, number[]>();
  for (let i = 0; i < nodes.length; i++) {
    const d = depth[i];
    const layer = byDepth.get(d);
    if (layer) {
      layer.push(i);
    } else {
      byDepth.set(d, [i]);
    }
  }

  for (const [depth, layer] of byDepth) {
    const ring = Math.max(1, depth) * 120;
    for (let i = 0; i < layer.length; i++) {
      const angle = (Math.PI * 2 * i) / layer.length;
      const nodeIndex = layer[i];
      const node = nodes[nodeIndex];
      if (node.bbox.x === 0 && node.bbox.y === 0) {
        x[nodeIndex] = Math.cos(angle) * ring;
        y[nodeIndex] = Math.sin(angle) * ring;
      }
    }
  }
}

function updateClusterCenters(state: LayoutState, centers: Map<GraphNodeBase, { x: number; y: number }>): void {
  const sums = new Map<GraphNodeBase, { x: number; y: number; count: number }>();
  for (let i = 0; i < state.x.length; i++) {
    const cluster = state.clusterRoot[i];
    const prev = sums.get(cluster);
    if (prev) {
      prev.x += state.x[i];
      prev.y += state.y[i];
      prev.count += 1;
    } else {
      sums.set(cluster, { x: state.x[i], y: state.y[i], count: 1 });
    }
  }

  centers.clear();
  for (const [clusterRoot, sum] of sums) {
    centers.set(clusterRoot, { x: sum.x / sum.count, y: sum.y / sum.count });
  }
}

function applyCenterForce(state: LayoutState, centerX: number, centerY: number, strength: number): void {
  for (let i = 0; i < state.x.length; i++) {
    state.vx[i] += (centerX - state.x[i]) * strength;
    state.vy[i] += (centerY - state.y[i]) * strength;
  }
}

function applyChargeForce(state: LayoutState, strength: number): void {
  for (let i = 0; i < state.x.length; i++) {
    for (let j = i + 1; j < state.x.length; j++) {
      let dx = state.x[j] - state.x[i];
      let dy = state.y[j] - state.y[i];
      const d2 = dx * dx + dy * dy + 0.01;
      const invDist = 1 / Math.sqrt(d2);
      dx *= invDist;
      dy *= invDist;

      const force = strength / d2;
      const fx = dx * force;
      const fy = dy * force;

      state.vx[i] -= fx;
      state.vy[i] -= fy;
      state.vx[j] += fx;
      state.vy[j] += fy;
    }
  }
}

function applyLinkForce(state: LayoutState, strength: number, targetDistance: number): void {
  for (let i = 0; i < state.x.length; i++) {
    const parent = state.parentIndex[i];
    if (parent < 0) {
      continue;
    }

    let dx = state.x[i] - state.x[parent];
    let dy = state.y[i] - state.y[parent];
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    const delta = dist - targetDistance;
    dx /= dist;
    dy /= dist;

    const fx = dx * delta * strength;
    const fy = dy * delta * strength;
    state.vx[i] -= fx;
    state.vy[i] -= fy;
    state.vx[parent] += fx;
    state.vy[parent] += fy;
  }
}

function applyClusterForce(
  state: LayoutState,
  centers: Map<GraphNodeBase, { x: number; y: number }>,
  strength: number
): void {
  for (let i = 0; i < state.x.length; i++) {
    const center = centers.get(state.clusterRoot[i]);
    if (!center) {
      continue;
    }
    state.vx[i] += (center.x - state.x[i]) * strength;
    state.vy[i] += (center.y - state.y[i]) * strength;
  }
}

function applyCollisions(state: LayoutState, padding: number): void {
  for (let i = 0; i < state.x.length; i++) {
    for (let j = i + 1; j < state.x.length; j++) {
      let dx = state.x[j] - state.x[i];
      let dy = state.y[j] - state.y[i];
      let dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = state.radius[i] + state.radius[j] + padding;
      if (dist >= minDist) {
        continue;
      }
      if (dist === 0) {
        dist = 0.001;
        dx = 0.001;
        dy = 0;
      }

      const overlap = (minDist - dist) / dist;
      const ox = dx * overlap * 0.5;
      const oy = dy * overlap * 0.5;

      state.x[i] -= ox;
      state.y[i] -= oy;
      state.x[j] += ox;
      state.y[j] += oy;
    }
  }
}

function integrate(state: LayoutState, damping: number): void {
  for (let i = 0; i < state.x.length; i++) {
    state.vx[i] *= damping;
    state.vy[i] *= damping;
    state.x[i] += state.vx[i];
    state.y[i] += state.vy[i];
  }
}
