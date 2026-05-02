import { IdPath } from '@lib/ast';
import { Quadtree } from './quad-tree';
import { eachBefore } from '../../utils';
import { GraphNodeBase } from '../../models';
import { getCentroid, getEachAfterNodes, intersection } from './util';

export function clusteredBubblesLayout(root: GraphNodeBase, nodes: Map<IdPath, GraphNodeBase>): void {
  let alpha = 1;
  const alphaMin = 0.001;
  const iterations = 500;
  const alphaDecay = 1 - Math.pow(alphaMin, 1 / iterations);
  const alphaTarget = 0;
  const velocityDecay = 0.6;
  const sortedNodes = getEachAfterNodes(root);

  // init
  for (let i = sortedNodes.length - 1; i >= 0; i--) {
    const node = sortedNodes[i];
    if (node.children.length) {
      node.bbox = intersection(node.children);
      node.radius = Math.max(node.bbox.width, node.bbox.height) / 2;
    }
  }

  for (let i = 0; i < iterations; i++) {
    alpha += (alphaTarget - alpha) * alphaDecay;
    forceCluster();
    forceCollide();

    for (let i = sortedNodes.length - 1; i >= 0; i--) {
      const node = sortedNodes[i];
      const dx = node.vx *= velocityDecay;
      const dy = node.vy *= velocityDecay;
      // translating parent and its children together
      eachBefore(node, c => {
        c.bbox.x += dx;
        c.bbox.y += dy;
      });

      if (node.children.length) {
        node.bbox = intersection(node.children);
        node.radius = Math.max(node.bbox.width, node.bbox.height) / 2;
      }
    }
  }

  // finish adjusting
  const rootDx = root.bbox.x < 0 ? root.bbox.x : 0;
  const rootDy = root.bbox.y < 0 ? root.bbox.y : 0;
  for (let i = sortedNodes.length - 1; i >= 0; i--) {
    const node = sortedNodes[i];
    node.bbox.x -= rootDx;
    node.bbox.y -= rootDy;
  }

  function forceCluster() {
    const strength = 0 * alpha;

    for (let i = sortedNodes.length - 1; i >= 0; i--) {
      const node = sortedNodes[i];
      const { x, y } = getCentroid(node.parent);
      node.vx -= (node.bbox.x - x) * strength;
      node.vy -= (node.bbox.y - y) * strength;
    }
  }

  function forceCollide() {
    const alpha = 1; // fixed for greater rigidity!
    const paddingSameParent = 2;
    const padding = 6;

    const quadtree = new Quadtree(root.bbox);
    for (let i = sortedNodes.length - 1; i >= 0; i--) {
      quadtree.insert(sortedNodes[i]);
    }

    for (let i = sortedNodes.length - 1; i >= 0; i--) {
      const node = sortedNodes[i];
      if (node === root) continue;

      // todo collide only children of the same parent
      quadtree.retrieve(node.bbox).forEach((query) => {
        if (query === node || query === node.parent || query.parent !== node.parent) return;

        const r = node.radius + query.radius + (node.parent?.id === query.parent?.id ? paddingSameParent : padding);
        let x = node.bbox.x - query.bbox.x;
        let y = node.bbox.y - query.bbox.y;
        let distance = Math.hypot(x, y);
        if (distance < r) {
          distance = ((distance - r) / (distance || 1)) * alpha;
          const dx = (x * distance) || Math.random();
          const dy = y * distance || Math.random();
          node.vx -= dx;
          node.vy -= dy;
          query.vx += dx;
          query.vy += dy;
        }
      });
    }
  }
}
