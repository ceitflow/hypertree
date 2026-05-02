import * as d3 from 'd3';
import { IdPath } from '@lib/ast';
import { eachBefore } from '../../utils';
import { CodeGraphNode, GraphNodeBase } from '../../models';

export function clusteredBubblesLayout(root: GraphNodeBase, nodes: Map<IdPath, GraphNodeBase>): void {
  const padding = 0.02;
  const pack = d3.pack<GraphNodeBase>().padding(padding);
  let smallestCodeRadius: GraphNodeBase | undefined = undefined;
  eachBefore(root, (n) => {
    if (n instanceof CodeGraphNode && (!smallestCodeRadius || n.radius < smallestCodeRadius.radius))
      smallestCodeRadius = n;
  });

  const circlePacking = pack(
    d3
      .hierarchy(root, (d) => (d.children.length ? d.children : null))
      .sum((d) => (d.children.length > 0 ? 0 : Math.max(1, d.area)))
      .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
  );

  let scale = 1;
  circlePacking.each((h) => {
    if (h.data === smallestCodeRadius) {
      scale = (h.data.radius) / (h.r)
      console.log(scale, h.r);
    }
  });

  circlePacking.each((h) => {
    const node = h.data;
    const r = h.r * scale;

    node.radius = r;
    node.bbox = {
      x: h.x * scale - r,
      y: h.y * scale - r,
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
