import { Point, VisibilityNode } from '../../edges';
import { eachAfter } from '../../../../shared/utils';
import { GraphModel, GraphNode, GraphNodeEnum, VirtualGraphNode } from '../../nodes';

type PositionData = {
  prevX: number;
  prevY: number;
  lastX: number;
  lastY: number;
};

const containsPoint = (arr: Point[], p: Point) =>
  arr.find((a) => {
    return Math.floor(a.x) === Math.floor(p.x) && Math.floor(a.y) === Math.floor(p.y);
  });

const getCornerPoints = (child: GraphNode, pos: PositionData) => {
  const { x, width, y } = child.bbox;
  const { x: cx, y: cy } = child.getCorner();
  const topOffset = (y - pos.prevY) / 2;
  const leftOffset = (x - pos.prevX) / 2;

  const topLeft = new VisibilityNode(x - leftOffset, y - topOffset);
  const topMiddle = new VisibilityNode(x + width / 2, y - topOffset);
  const topRight = new VisibilityNode(cx + (pos.lastX - cx) / 2, y - topOffset);
  const bottomRight = new VisibilityNode(cx + (pos.lastX - cx) / 2, cy + (pos.lastY - cy) / 2);
  const bottomLeft = new VisibilityNode(x - leftOffset, cy + (pos.lastY - cy) / 2);
  return { topLeft, topMiddle, topRight, bottomRight, bottomLeft };
};

export class Router {
  // Creates visibility graph
  //  - first create vertices
  //  - then add edges between them if they are reachable
  static init(graphModel: GraphModel) {
    eachAfter(graphModel.root, (dir) => {
      if (dir.type !== GraphNodeEnum.Directory || !dir.children.length) {
        return;
      }
      const b = dir.bbox;
      const graph = dir.routeVisibilityGraph;
      const root = new VisibilityNode(b.x + b.width / 2, b.y);
      graph.rootNodeId = root.id;
      graph.vertices.set(root.id, root);

      buildRow(dir, { prevX: b.x, prevY: b.y, lastX: dir.getCorner().x, lastY: dir.getCorner().y });

      function buildRow({ children }: GraphNode, pos: PositionData): { bottom: Point[]; right: Point[] } {
        const bottom: Point[] = [];
        let prevRightPoints: Point[] = []; // for comparing and avoiding adding duplicates

        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const isLast = i === children.length - 1;
          const prevX = i === 0 ? pos.prevX : prevRightPoints[0].x - (child.bbox.x - prevRightPoints[0].x); // previous have correct x pos
          const posData = {
            prevX,
            prevY: pos.prevY,
            lastX: isLast ? pos.lastX : children[i + 1].bbox.x,
            lastY: pos.lastY
          };

          if (child.type === GraphNodeEnum.Virtual) {
            if (child.isColumnWrapper) {
              const { right, bottom: bot } = buildColumn(child, posData);
              prevRightPoints = right;
              bottom.push(...bot);
            } else {
              const { right, bottom: bot } = buildRow(child, posData);
              prevRightPoints = right;
              bottom.push(...bot);
            }
          } else {
            const { topLeft, topMiddle, topRight, bottomRight, bottomLeft } = getCornerPoints(child, posData);
            graph.vertices.set(topRight.id, topRight);
            graph.vertices.set(bottomRight.id, bottomRight);

            if (!containsPoint(prevRightPoints, topLeft)) graph.vertices.set(topLeft.id, topLeft);
            if (!containsPoint(prevRightPoints, bottomLeft)) graph.vertices.set(bottomLeft.id, bottomLeft);
            if (child.type === GraphNodeEnum.Directory) graph.vertices.set(topMiddle.id, topMiddle);

            bottom.push(bottomLeft, bottomRight.toPoint());
            prevRightPoints = [topRight.toPoint(), bottomRight.toPoint()];
          }
        }
        return { bottom, right: prevRightPoints };
      }

      function buildColumn({ children }: VirtualGraphNode, pos: PositionData): { bottom: Point[]; right: Point[] } {
        const leftX = pos.prevX;
        const right: Point[] = [];
        let prevTopPoints: Point[] = [{ x: pos.prevX, y: pos.prevY }];

        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          const isLast = i === children.length - 1;
          const prevY = i === 0 ? pos.prevY : prevTopPoints[0].y - (child.bbox.y - prevTopPoints[0].y); // previous have correct y pos
          const { x, y } = child.bbox;

          const topOffset = (y - prevY) / 2;
          const leftOffset = (x - leftX) / 2;
          const posData = {
            prevX: leftX,
            prevY,
            lastX: pos.lastX,
            lastY: isLast ? pos.lastY : children[i + 1].bbox.y
          };

          if (child.type === GraphNodeEnum.Virtual) {
            // rows only, columns are always merged
            const { bottom, right: r } = buildRow(child, posData);
            prevTopPoints = bottom;
            right.push(...r);
          } else {
            const { topLeft, topMiddle, topRight, bottomRight, bottomLeft } = getCornerPoints(child, posData);
            graph.vertices.set(bottomRight.id, bottomRight);
            graph.vertices.set(bottomLeft.id, bottomLeft);

            if (!containsPoint(prevTopPoints, topLeft)) graph.vertices.set(topLeft.id, topLeft);
            if (!containsPoint(prevTopPoints, topRight)) graph.vertices.set(topRight.id, topRight);
            if (child.type === GraphNodeEnum.Directory) graph.vertices.set(topMiddle.id, topMiddle);

            right.push(topRight, bottomRight.toPoint());
            prevTopPoints = [bottomRight.toPoint(), bottomLeft.toPoint()];
          }
        }
        return { bottom: prevTopPoints, right };
      }

      // todo stage 2 do Dijkstra to assign Edges in VisibilityEdges
    });
  }
}
