import { Point, VisibilityNode } from '../../edges';
import { eachAfter } from '../../../../shared/utils';
import { GraphNodeEnum, GraphModel, GraphNode } from '../../nodes';

const getRightMostPoint = (p: Point[]) => p.reduce((acc, cur) => Math.max(acc, cur.x), p[0].x);
const containsPoint = (arr: Point[], p: Point) => arr.find((a) => a.x === p.x && a.y === p.y);

export class Router {
  static init(graphModel: GraphModel) {
    eachAfter(graphModel.root, (dir) => {
      if (dir.type !== GraphNodeEnum.Directory || !dir.children.length) {
        return;
      }
      // add root output visibility node
      const b = dir.bbox;
      const graph = dir.routeVisibilityGraph;
      const root = new VisibilityNode(b.x + b.width / 2, b.y);
      graph.rootNodeId = root.id;
      graph.vertices.set(root.id, root);
      buildRow(dir, { prevX: b.x, prevY: b.y });

      // 1. create visibility graph
      //  - first create vertices
      //  - then add edges between them if they are reachable
      // vertices are in the middle between 2 nodes
      //  - check if v is column or row, then read their corners

      function buildRow(v: GraphNode, pos: { prevX: number; prevY: number }): { bottom: Point[]; right: Point[] } {
        const bottom: Point[] = [];
        const right: Point[] = [];
        let prevRightPoints: Point[] = [{ x: pos.prevX, y: pos.prevY }];

        for (let i = 0; i < v.children.length; i++) {
          const child = v.children[i];
          const isLast = i === v.children.length - 1;
          const debugColor = v.type === GraphNodeEnum.Virtual ? '#F00' : '#F00';
          const topOffset = (child.bbox.y - pos.prevY) / 2;

          const { x, y, width } = child.bbox;
          const prevX = getRightMostPoint(prevRightPoints);
          const leftOffset = (x - prevX) / 2;

          if (i > 0) {
            prevRightPoints.forEach((p) => {
              const middleX = prevX + (x - prevX) / 2;
              const node = new VisibilityNode(middleX, p.y);
              graph.vertices.set(node.id, node);
            });
          }

          if (child.type === GraphNodeEnum.Virtual) {
            if (child.isColumnWrapper) {
              const recursivePoints = buildColumn(child);
            } else {
              const { right } = buildRow(child, { prevX, prevY: v.bbox.y });
              prevRightPoints = right;
            }
          } else {
            const topLeft = { x: x - leftOffset, y: y - topOffset };
            const bottomLeft = { x: x - leftOffset, y: child.getBottomMiddle().y + child.margin.bottom / 2 };
            if (!containsPoint(prevRightPoints, topLeft)) {
              const p = new VisibilityNode(topLeft.x, topLeft.y, debugColor);
              graph.vertices.set(p.id, p);
            }
            if (!containsPoint(prevRightPoints, bottomLeft)) {
              const p = new VisibilityNode(bottomLeft.x, bottomLeft.y, debugColor);
              graph.vertices.set(p.id, p);
            }
            if (child.type === GraphNodeEnum.Directory) {
              const topMiddle = new VisibilityNode(x + width / 2, y - topOffset, debugColor);
              graph.vertices.set(topMiddle.id, topMiddle);
            }
            const topRight = { x: child.getRightMiddle().x, y: y - topOffset };
            const bottomRight = { x: child.getRightMiddle().x, y: child.getBottomMiddle().y + child.margin.bottom / 2 };
            prevRightPoints = [topRight, bottomRight];
          }

          if (isLast) {
            prevRightPoints.forEach((p) => {
              const rightMostX = getRightMostPoint(prevRightPoints);
              const middleX = rightMostX + (v.getRightMiddle().x - rightMostX) / 2;
              const node = new VisibilityNode(middleX, p.y);
              graph.vertices.set(node.id, node);
            });
          }
        }
        return { bottom, right };
      }

      function buildColumn(v: GraphNode) {

      }

      // todo stage 2 do Dijkstra to assign Edges in VisibilityEdges
    });
  }
}
