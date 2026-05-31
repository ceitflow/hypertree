import { Quadtree } from '../quad-tree';
import { GraphNodeBase } from '../../../models';

const EPSILON = 0.2;

export function rectCollide(nodes: GraphNodeBase[]): boolean {
  if (!nodes.length) return false;

  const parentBbox = nodes[0].parent?.bbox;
  if (!parentBbox) return false;

  let movedAny = false;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const n of nodes) {
    const bbox = n.bbox;
    if (bbox.x < minX) minX = bbox.x;
    if (bbox.y < minY) minY = bbox.y;
    if (bbox.x + bbox.width > maxX) maxX = bbox.x + bbox.width;
    if (bbox.y + bbox.height > maxY) maxY = bbox.y + bbox.height;
  }

  if (!isFinite(minX)) return false;

  const tree = new Quadtree(
    {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    },
    nodes
  );

  for (const node of nodes) {
    const neighbours = tree.retrieve(node) as Set<GraphNodeBase>;

    for (const neigh of neighbours) {
      if (neigh === node) continue;

      const centerX = node.bbox.x + node.bbox.width / 2;
      const centerY = node.bbox.y + node.bbox.height / 2;
      const neighCenterX = neigh.bbox.x + neigh.bbox.width / 2;
      const neighCenterY = neigh.bbox.y + neigh.bbox.height / 2;

      const centerDiffX = Math.abs(neighCenterX - centerX);
      const centerDiffY = Math.abs(neighCenterY - centerY);

      const overlapX = (node.bbox.width + neigh.bbox.width) / 2 - centerDiffX;
      const overlapY = (node.bbox.height + neigh.bbox.height) / 2 - centerDiffY;

      // if separated on X or on Y go to the next neighbor (overlap happens on both axes simultaneously)
      if (overlapX <= EPSILON || overlapY <= EPSILON) continue;

      movedAny = true;

      // Resolve along the axis of smallest penetration, pushing the
      // farther-from-(parent top-left) node down/right.
      if (overlapX < overlapY) {
        const push = overlapX;
        if (centerX >= neighCenterX) node.bbox.x += push;
        else neigh.bbox.x += push;
      } else {
        const push = overlapY;
        if (centerY >= neighCenterY) node.bbox.y += push;
        else neigh.bbox.y += push;
      }
    }
  }
  return movedAny;
}
