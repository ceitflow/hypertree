import { eachBefore } from '../../utils';
import { GraphNode, GraphNodeBase, VirtualGraphNode } from '../../models';

export function addHeader(n: GraphNodeBase, height: number): void {
  const header = VirtualGraphNode.create(`${n.id}/header`, n as GraphNode);
  header.depth = n.depth;
  header.isHeader = true;
  header.bbox.x = 0;
  header.bbox.y = 0;
  header.bbox.width = n.bbox.width;
  header.bbox.height = height;

  // push every existing child down to make room for the header
  n.children.forEach((child) => {
    eachBefore(child, (descendant) => {
      descendant.bbox.y += header.bbox.height;
    });
  });

  n.children.unshift(header);
  n.bbox.height += header.bbox.height;
}
