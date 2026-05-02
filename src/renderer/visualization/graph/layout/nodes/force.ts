import { IdPath } from '@lib/ast';
import { Quadtree } from './quad-tree';
import { eachBefore } from '../../utils';
import { BBox, DirectoryGraphNode, GraphNodeBase } from '../../models';
import { getCentroid, getEachAfterDirectories, intersection } from './util';

function jiggle() {
  return (Math.random() - 0.5) * 1e-6;
}

function updateParentBBox(dir: DirectoryGraphNode) {
  dir.bbox = intersection(dir.children);
  dir.radius = Math.max(dir.bbox.width, dir.bbox.height) / 2;
}

export function clusteredBubblesLayout(root: GraphNodeBase, nodes: Map<IdPath, GraphNodeBase>): void {
  const strength = 1;
  const iterations = 300;
  const sortedDirs = getEachAfterDirectories(root);

  for (let i = sortedDirs.length - 1; i >= 0; i--) {
    const dir = sortedDirs[i];
    if (!dir.children.length) return;
    updateParentBBox(dir);
    force(dir, iterations);
    updateParentBBox(dir);
  }
}

function force(dir: DirectoryGraphNode, iterations: number): void {
  if (!dir.parent) { // if root node
    // translate all to positive coordinates
    const rootDx = dir.bbox.x < 0 ? dir.bbox.x : 0;
    const rootDy = dir.bbox.y < 0 ? dir.bbox.y : 0;
    eachBefore(dir, (n) => {
      n.bbox.x -= rootDx;
      n.bbox.y -= rootDy;
    });
    return;
  }

  for (let i = 0; i < iterations; i++) {
    // forceCluster();
    forceCollide(dir);

    for (let i = dir.children.length - 1; i >= 0; i--) {
      const child = dir.children[i];
      // translating children and its children recursively
      eachBefore(child, (n) => {
        n.bbox.x += child.vx;
        n.bbox.y += child.vy;
      });
    }
  }
}

function forceCluster(nodes: GraphNodeBase[]) {
  const strength = 0.2;

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const { x, y } = getCentroid(node.parent);
    node.vx -= (node.bbox.x - x) * strength;
    node.vy -= (node.bbox.y - y) * strength;
  }
}

function forceCollide(dir: DirectoryGraphNode) {
  const quadtree = new Quadtree(dir.bbox, dir.children);

  for (let i = dir.children.length - 1; i >= 0; i--) {
    const node = dir.children[i];

    for (const overlappingNode of quadtree.retrieve(node)) {
      const r = node.radius + overlappingNode.radius;
      const x = node.bbox.x - overlappingNode.bbox.x;
      const y = node.bbox.y - overlappingNode.bbox.y;
      let distance = Math.hypot(x, y);
      if (distance < r) {
        distance = (distance - r) / (distance || 1);
        const dx = x * distance || jiggle();
        const dy = y * distance || jiggle();
        node.vx += -dx;
        node.vy += -dy;
        overlappingNode.vx += dx;
        overlappingNode.vy += dy;
      }
    }
  }
}
