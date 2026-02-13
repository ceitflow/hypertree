import { eachAfter } from '../../../../shared/utils';
import { Point, VisibilityGraph, VisibilityNode } from '../../edges';
import { GraphNodeEnum, GraphModel, VirtualGraphNode } from '../../nodes';

export class Router {
  static init(graphModel: GraphModel) {
    eachAfter(graphModel.root, (v) => {
      if (v.type !== GraphNodeEnum.Directory || !v.children.length) {
        return;
      }
      // add root output visibility node
      const graph = v.routeVisibilityGraph;
      const root = new VisibilityNode(v.bbox.x + v.bbox.width / 2, v.bbox.y);
      graph.rootNodeId = root.id;
      graph.vertices.set(root.id, root);

      // 1. create visibility graph
      //  - first create vertices
      //  - then add edges between them if they are reachable
      // vertices are in the middle between 2 nodes
      //  - check if v is column or row, then read their corners

      for (let i = 0; i < v.children.length; i++) {
        const debugColor = '#F00';
        const topOffset = v.padding.top / 2;

        const prev = v.children[i - 1];
        const child = v.children[i];
        const { width, height } = child.bbox;
        const origin = child.getOrigin();
        const prevX = prev ? prev.getRightMiddle().x : v.bbox.x;
        const leftOffset = (origin.x - prevX) / 2;

        switch (child.type) {
          case GraphNodeEnum.Directory: {
            const topMiddle = new VisibilityNode(origin.x + width / 2, origin.y - topOffset, debugColor);
            graph.vertices.set(topMiddle.id, topMiddle);
            break;
          }

          case GraphNodeEnum.Virtual: {
            if (child.isColumnWrapper) {
              // const recursivePoints = buildColumn(c);
            } else {
              const recursiveSides = this.buildVirtualRow(child, graph, prevX, v.bbox.y);
            }
            continue;
          }
        }

        const topMiddle = new VisibilityNode(origin.x + width / 2, origin.y - topOffset, debugColor);
        const topLeft = new VisibilityNode(origin.x - leftOffset, origin.y - topOffset, debugColor);
        const bottomLeft = new VisibilityNode(
          origin.x - leftOffset,
          child.getBottomMiddle().y + child.margin.bottom / 2,
          debugColor
        );
        graph.vertices.set(topMiddle.id, topMiddle);
        graph.vertices.set(topLeft.id, topLeft);
        graph.vertices.set(bottomLeft.id, bottomLeft);

        if (prev) {
          // add bottom node of previous node (having known the offset)
          const prevBottomRight = new VisibilityNode(
            prev.getRightMiddle().x + leftOffset,
            prev.getBottomMiddle().y + prev.margin.bottom / 2,
            debugColor
          );
          graph.vertices.set(prevBottomRight.id, prevBottomRight);
        }

        if (i === v.children.length - 1) {
          // if last
          const right = child.getRightMiddle().x + (v.getRightMiddle().x - child.getRightMiddle().x) / 2;
          const topRight = new VisibilityNode(right, origin.y - topOffset, debugColor);
          const bottomRight = new VisibilityNode(right, child.getBottomMiddle().y + child.margin.bottom / 2, debugColor);
          graph.vertices.set(topRight.id, topRight);
          graph.vertices.set(bottomRight.id, bottomRight);
        }
      }

      // todo stage 2 do Dijkstra to assign Edges in VisibilityEdges
    });
  }

  private static buildVirtualRow(
    virtual: VirtualGraphNode,
    graph: VisibilityGraph,
    prevXPos: number,
    prevYPos: number
  ): { bottom: Point[]; right: Point[] } {
    const bottom: Point[] = [];
    const right: Point[] = [];
    const debugColor = '#00F';

    const topOffset = (virtual.bbox.y - prevYPos) / 2;

    for (let i = 0; i < virtual.children.length; i++) {
      const prev = virtual.children[i - 1];
      const child = virtual.children[i];
      const { width, height } = child.bbox;
      const origin = child.getOrigin();
      const prevX = prev ? prev.getRightMiddle().x : prevXPos;
      const leftOffset = (origin.x - prevX) / 2;

      switch (child.type) {
        case GraphNodeEnum.Directory: {
          const topMiddle = new VisibilityNode(origin.x + width / 2, origin.y - topOffset, debugColor);
          graph.vertices.set(topMiddle.id, topMiddle);
          break;
        }

        case GraphNodeEnum.Virtual: {
          if (child.isColumnWrapper) {
            // const recursivePoints = buildColumn(c);
          } else {
            const recursiveSides = this.buildVirtualRow(child, graph, prevX, prevYPos);
          }
          break;
        }
      }

      const topLeft = new VisibilityNode(origin.x - leftOffset, origin.y - topOffset, debugColor);
      const bottomLeft = new VisibilityNode(
        origin.x - leftOffset,
        child.getBottomMiddle().y + child.margin.bottom / 2,
        debugColor
      );
      graph.vertices.set(topLeft.id, topLeft);
      graph.vertices.set(bottomLeft.id, bottomLeft);

      if (prev) {
        // add bottom node of previous node (having known the offset)
        const prevBottomRight = new VisibilityNode(
          prev.getRightMiddle().x + leftOffset,
          prev.getBottomMiddle().y + prev.margin.bottom / 2,
          debugColor
        );
        graph.vertices.set(prevBottomRight.id, prevBottomRight);
      }

      if (i === virtual.children.length - 1) {
        // if last
        const right = child.getRightMiddle().x + (virtual.getRightMiddle().x - child.getRightMiddle().x) / 2;
        const topRight = new VisibilityNode(right, origin.y - topOffset, debugColor);
        const bottomRight = new VisibilityNode(right, child.getBottomMiddle().y + child.margin.bottom / 2, debugColor);
        graph.vertices.set(topRight.id, topRight);
        graph.vertices.set(bottomRight.id, bottomRight);
      }
    }

    return { bottom, right };
  }
}
