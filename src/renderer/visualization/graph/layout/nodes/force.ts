export type ForceTreeNode = {
  id: string;
  children: ForceTreeNode[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  radius?: number;
};

type SimNode = {
  id: string;
  ref: ForceTreeNode;
  parent?: SimNode;
  children: SimNode[];
  clusterId: string;
  depth: number;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
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
  root: ForceTreeNode,
  options: ClusteredForceLayoutOptions = {}
): ForceTreeNode {
  const cfg = { ...DEFAULTS, ...options };
  const nodes = flattenTree(root, cfg.nodeRadius);
  if (nodes.length === 0) {
    return root;
  }

  initializePositions(nodes);
  const clusterCenters = new Map<string, { x: number; y: number }>();
  const centerX = cfg.width / 2;
  const centerY = cfg.height / 2;

  let alpha = cfg.alpha;
  for (let i = 0; i < cfg.iterations; i++) {
    updateClusterCenters(nodes, clusterCenters);
    applyCenterForce(nodes, centerX, centerY, cfg.centerStrength * alpha);
    applyChargeForce(nodes, cfg.chargeStrength * alpha);
    applyLinkForce(nodes, cfg.linkStrength * alpha, cfg.linkDistance);
    applyClusterForce(nodes, clusterCenters, cfg.clusterStrength * alpha);
    applyCollisions(nodes, cfg.collisionPadding);
    integrate(nodes, cfg.damping);
    alpha *= 1 - cfg.alphaDecay;
  }

  for (const n of nodes) {
    n.ref.x = n.x;
    n.ref.y = n.y;
    n.ref.vx = n.vx;
    n.ref.vy = n.vy;
  }
  return root;
}

function flattenTree(root: ForceTreeNode, defaultRadius: number): SimNode[] {
  const result: SimNode[] = [];
  const queue: Array<{
    node: ForceTreeNode;
    parent?: SimNode;
    depth: number;
    clusterId: string;
  }> = [{ node: root, parent: undefined, depth: 0, clusterId: root.id }];

  while (queue.length > 0) {
    const { node, parent, depth, clusterId } = queue.shift() as {
      node: ForceTreeNode;
      parent?: SimNode;
      depth: number;
      clusterId: string;
    };

    const current: SimNode = {
      id: node.id,
      ref: node,
      parent,
      children: [],
      clusterId,
      depth,
      radius: node.radius ?? defaultRadius,
      x: node.x ?? 0,
      y: node.y ?? 0,
      vx: node.vx ?? 0,
      vy: node.vy ?? 0
    };

    if (parent) {
      parent.children.push(current);
    }
    result.push(current);

    const nextChildren = node.children ?? [];
    for (const child of nextChildren) {
      // Cluster by first-level ancestor under root.
      const nextCluster = depth === 0 ? child.id : clusterId;
      queue.push({ node: child, parent: current, depth: depth + 1, clusterId: nextCluster });
    }
  }

  return result;
}

function initializePositions(nodes: SimNode[]): void {
  // Deterministic circular seeding keeps simulation stable.
  const byDepth = new Map<number, SimNode[]>();
  for (const n of nodes) {
    const layer = byDepth.get(n.depth);
    if (layer) {
      layer.push(n);
    } else {
      byDepth.set(n.depth, [n]);
    }
  }

  for (const [depth, layer] of byDepth) {
    const ring = Math.max(1, depth) * 120;
    for (let i = 0; i < layer.length; i++) {
      const angle = (Math.PI * 2 * i) / layer.length;
      const n = layer[i];
      if (n.ref.x === undefined) {
        n.x = Math.cos(angle) * ring;
      }
      if (n.ref.y === undefined) {
        n.y = Math.sin(angle) * ring;
      }
    }
  }
}

function updateClusterCenters(nodes: SimNode[], centers: Map<string, { x: number; y: number }>): void {
  const sums = new Map<string, { x: number; y: number; count: number }>();
  for (const n of nodes) {
    const prev = sums.get(n.clusterId);
    if (prev) {
      prev.x += n.x;
      prev.y += n.y;
      prev.count += 1;
    } else {
      sums.set(n.clusterId, { x: n.x, y: n.y, count: 1 });
    }
  }

  centers.clear();
  for (const [clusterId, sum] of sums) {
    centers.set(clusterId, { x: sum.x / sum.count, y: sum.y / sum.count });
  }
}

function applyCenterForce(nodes: SimNode[], centerX: number, centerY: number, strength: number): void {
  for (const n of nodes) {
    n.vx += (centerX - n.x) * strength;
    n.vy += (centerY - n.y) * strength;
  }
}

function applyChargeForce(nodes: SimNode[], strength: number): void {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + 0.01;
      const invDist = 1 / Math.sqrt(d2);
      dx *= invDist;
      dy *= invDist;

      const force = strength / d2;
      const fx = dx * force;
      const fy = dy * force;

      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }
}

function applyLinkForce(nodes: SimNode[], strength: number, targetDistance: number): void {
  for (const n of nodes) {
    if (!n.parent) {
      continue;
    }

    const p = n.parent;
    let dx = n.x - p.x;
    let dy = n.y - p.y;
    const dist = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    const delta = dist - targetDistance;
    dx /= dist;
    dy /= dist;

    const fx = dx * delta * strength;
    const fy = dy * delta * strength;
    n.vx -= fx;
    n.vy -= fy;
    p.vx += fx;
    p.vy += fy;
  }
}

function applyClusterForce(
  nodes: SimNode[],
  centers: Map<string, { x: number; y: number }>,
  strength: number
): void {
  for (const n of nodes) {
    const center = centers.get(n.clusterId);
    if (!center) {
      continue;
    }
    n.vx += (center.x - n.x) * strength;
    n.vy += (center.y - n.y) * strength;
  }
}

function applyCollisions(nodes: SimNode[], padding: number): void {
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.radius + b.radius + padding;
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

      a.x -= ox;
      a.y -= oy;
      b.x += ox;
      b.y += oy;
    }
  }
}

function integrate(nodes: SimNode[], damping: number): void {
  for (const n of nodes) {
    n.vx *= damping;
    n.vy *= damping;
    n.x += n.vx;
    n.y += n.vy;
  }
}
