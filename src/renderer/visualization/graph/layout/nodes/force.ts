import * as d3 from 'd3';
import { IdPath } from '@lib/ast';
import { d3pack } from './d3pack';
import { eachBefore } from '../../utils';
import { HierarchyCircularNode } from 'd3';
import { GraphNodeBase } from '../../models';

export function clusteredBubblesLayout(root: GraphNodeBase, nodes: Map<IdPath, GraphNodeBase>): void {
  const circlePacking = d3pack()(
    d3
      .hierarchy(root, (d) => (d.children.length ? d.children : null))
      .sum((d) => (d.children.length > 0 ? 0 : Math.max(1, d.area)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0)) as HierarchyCircularNode<GraphNodeBase>
  );
  circlePacking.each((h) => {
    const node = h.data;
    const r = Math.floor(h.r) || 1;

    node.radius = r;
    node.bbox = {
      x: h.x - r,
      y: h.y - r,
      width: r * 2,
      height: r * 2
    };
  });

  // TODO put files into virtualnode, put label in a node (?)
  //  possibly post process with force directed layout

  const rootDx = root.bbox.x < 0 ? root.bbox.x : 0;
  const rootDy = root.bbox.y < 0 ? root.bbox.y : 0;
  eachBefore(root, (n) => {
    n.bbox.x -= rootDx;
    n.bbox.y -= rootDy;
  });
}
