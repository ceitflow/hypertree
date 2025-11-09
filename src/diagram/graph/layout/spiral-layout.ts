import { Graph } from '../graph.ts';
import { NodeModel } from '../types.ts';
import { eachAfter, TidyTree } from './tidy-tree.ts';

export function SpiralLayout(graph: Graph) {
  const radial = graph.getRootRadial();
  if (!radial) {
    return;
  }
  const root = radial.children.get(radial.rootId)!;
  console.log(root);
  const bottomNode = TidyTree(root, { mode: 'horizontal' });
  Spiral(root, bottomNode);
}

function Spiral(root: NodeModel, bottomNode: NodeModel) {
  const offset = 600 * Math.PI;
  const width = 12 * Math.PI;
  const armWidth = width * 2 * Math.PI; // distance between spiral arms divided by 2𝜋
  const totalDepth = bottomNode.depth;

  // todo need extent for each node (minX maxX)
  eachAfter(root, v => {
    const L = v.x + offset;
    if (L === 0) {
      v.polarX = 0;
      v.polarY = 0;
      return;
    }
    // Step 1: Calculate the angle θ from the arc length L ≈ (a/2) * θ^2  =>  θ = sqrt(2L / a)
    const theta = Math.sqrt((2 * L) / width);
    // Step 2: Calculate the radius r = a * θ with offset
    let radius = width * theta;
    if (v.children.length) {
      radius = Math.max(0, radius - (totalDepth - v.depth) / totalDepth * armWidth);
    }
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    v.angle = theta % (2 * Math.PI);
    v.polarX = x;
    v.polarY = y;
  });
  root.polarX = 0;
  root.polarY = 0;
}
