import { eachBefore } from '../../../utils';
import { GraphNode, GraphNodeBase, VirtualGraphNode } from '../../../models';

export function addDirectoryHeader(n: GraphNodeBase): void {
  const header = VirtualGraphNode.create(`${n.id}/header`, n as GraphNode, { isHeader: true });
  header.depth = n.depth;
  header.bbox.x = 0;
  header.bbox.y = 0;
  header.bbox.width = n.bbox.width;
  header.bbox.height = Math.max(Math.round(n.bbox.height * 0.03), 300);

  // push every existing child down to make room for the header
  n.children.forEach((child) => {
    eachBefore(child, (descendant) => {
      descendant.bbox.y += header.bbox.height;
    });
  });

  n.children.unshift(header);
  n.header = header;
  n.bbox.height += header.bbox.height;
}

export function addCodeHeader(n: GraphNodeBase): void {
  const header = VirtualGraphNode.create(`${n.id}/header`, n as GraphNode, { isHeader: true });
  header.depth = n.depth;
  header.bbox.x = 0;
  header.bbox.y = 0;
  header.bbox.width = n.bbox.width;
  header.bbox.height = 40;

  // push every existing child down to make room for the header
  n.children.forEach((child) => {
    eachBefore(child, (descendant) => {
      descendant.bbox.y += header.bbox.height;
    });
  });

  n.children.unshift(header);
  n.header = header;
  n.bbox.height += header.bbox.height;
}
