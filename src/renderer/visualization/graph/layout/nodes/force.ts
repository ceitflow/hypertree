import * as d3 from 'd3';
import { IdPath } from '@lib/ast';
import { eachBefore } from '../../utils';
import { DirectoryGraphNode, GraphNodeBase } from '../../models';
import { getEachAfterNodes, getEncompassingSquareBBox } from './util';

type D3Wrapper = {
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
} & GraphNodeBase;

function updateParentBBox(dir: GraphNodeBase) {
  const square = getEncompassingSquareBBox(dir.children);
  const centerX = square.x + square.width / 2;
  const centerY = square.y + square.height / 2;

  const getDst = (x: number, y: number): number => {
    return Math.hypot(x - centerX, y - centerY);
  };

  let radius = 0;
  dir.children.forEach(({ bbox: { x, y, width, height } }) => {
    const topLeft = getDst(x, y);
    const topRight = getDst(x + width, y);
    const bottomLeft = getDst(x, y + height);
    const bottomRight = getDst(x + width, y + height);
    if (topLeft > radius) radius = topLeft;
    if (topRight > radius) radius = topRight;
    if (bottomLeft > radius) radius = bottomLeft;
    if (bottomRight > radius) radius = bottomRight;
  });

  dir.radius = radius;
  dir.bbox = { x: centerX - radius, y: centerY - radius, width: 2 * radius, height: 2 * radius };
}

export function clusteredBubblesLayout(root: GraphNodeBase, nodes: Map<IdPath, GraphNodeBase>): void {
  const iterations = 500;
  const sortedNodes = getEachAfterNodes(root);

  for (let i = sortedNodes.length - 1; i >= 0; i--) {
    const dir = sortedNodes[i];
    if (!dir.children.length) return;
    updateParentBBox(dir);
    force(dir, iterations);
    updateParentBBox(dir);
  }
  // translate all to positive coordinates
  const rootDx = root.bbox.x < 0 ? root.bbox.x : 0;
  const rootDy = root.bbox.y < 0 ? root.bbox.y : 0;
  eachBefore(root, (n) => {
    const node = n as D3Wrapper;
    node.bbox.x -= rootDx;
    node.bbox.y -= rootDy;
    delete node.x;
    delete node.y;
    delete node.vx;
    delete node.vy;
  });
  return;
}

function force(dir: GraphNodeBase, iterations: number): void {
  const nodes = dir.children as D3Wrapper[];
  const simulation = d3
    .forceSimulation(nodes)
    .force('x', d3.forceX().strength(0.01))
    .force('y', d3.forceY().strength(0.01))
    .force(
      'collide',
      d3
        .forceCollide<D3Wrapper>()
        .radius((d) => d.radius)
        .iterations(3)
    )
    .stop();

  for (let i = 0; i < iterations; i++) {
    simulation.tick();

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      const dx = node.bbox.x - node.x!;
      const dy = node.bbox.y - node.y!;
      // translating children and its children recursively
      eachBefore(node, (c) => {
        const child = c as D3Wrapper;
        child.bbox.x -= dx;
        child.bbox.y -= dy;
      });
    }
  }
}
