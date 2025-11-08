import { Graph } from '../graph.ts';
import { NodeModel } from '../types.ts';
import { NodeDiameter } from './layout-factory.ts';
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
  let tempArcAngle = -Math.PI * 2;
  let tempArcY = -Math.PI * 2;
  const arcdxWidth = 50;
  const estArmWidth = arcdxWidth * 6; // ?
  let prev: NodeModel;
  eachAfter(root, v => {
    const c = v.children;
    if (c.length) {
      const middle = c.length % 2 === 1 ? c[Math.floor(c.length / 2)] : c[Math.floor(c.length / 2)];
      const widthDx = estArmWidth / bottomNode.depth;
      v.spiralDy = (bottomNode.depth - v.depth) * widthDx;
      const dy = v.spiralDy - middle.spiralDy;
      v.angle = middle.angle;
      v.polarX = middle.polarX + dy * Math.cos(middle.angle);
      v.polarY = middle.polarY + dy * Math.sin(middle.angle);
    }
    // leaf node
    else {
      const padding = prev && prev.parent !== v.parent ? NodeDiameter / 2 : 0;
      const step = (NodeDiameter + padding) / Math.sqrt(tempArcY * tempArcY + arcdxWidth * arcdxWidth); // dx / arcLength  <- sinus?
      tempArcAngle -= step;
      tempArcY = arcdxWidth * tempArcAngle;
      v.angle = tempArcAngle % (2 * Math.PI);
      v.polarX = tempArcY * Math.cos(tempArcAngle);
      v.polarY = tempArcY * Math.sin(tempArcAngle);
    }
    prev = v;
  });
  root.polarX = 0;
  root.polarY = 0;
}
