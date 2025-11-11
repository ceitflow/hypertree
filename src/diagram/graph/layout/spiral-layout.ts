import { Graph } from '../graph.ts';
import { NodeModel } from '../types.ts';
import { YPosition, TidyTree, eachAfter } from './tidy-tree.ts';

export function SpiralLayout(graph: Graph) {
  const root = graph.model?.root;
  if (!root) {
    return;
  }
  console.log(root);
  const bottomNode = TidyTree(root);
  Spiral(root, bottomNode.ref);
}

function Spiral(root: NodeModel, bottomNode: NodeModel) {
  const totalDepth = bottomNode.depth;
  const armWidth = YPosition(totalDepth) / 2; // distance between spiral arms divided by 2𝜋
  const width = armWidth / 2 / Math.PI;
  const startOffset = 600 * Math.PI;
  let prev!: NodeModel;
  let padding = 0;
  console.log(`armWidth: ${armWidth}, depth: ${totalDepth}, increment: ${armWidth / totalDepth}`)

  eachAfter(root, v => {
    padding += prev && !v.children.length && prev.parent !== v.parent ? 12 : 0;
    const L = v.x + startOffset + padding;
    if (L === 0) {
      v.x = 0;
      v.y = 0;
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
    v.x = x;
    v.y = y;
    prev = v;
  });
  root.x = 0;
  root.y = 0;
}
