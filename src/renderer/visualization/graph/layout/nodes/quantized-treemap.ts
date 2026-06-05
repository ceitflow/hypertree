import { eachAfter, eachBefore } from '../../utils';
import { getContainerSize, getRowHeight, getRowWidth } from './utils';
import { GraphNode, GraphNodeBase, GraphNodeEnum } from '../../models';

const size = 120;
const margin = 24;

function wrapIntoRows(children: GraphNode[]): GraphNode[][] {
  const aspectRatio = (rows: GraphNode[][]): number => {
    const { width, height } = getContainerSize(rows, margin);
    if (width === 0 || height === 0) return Infinity;
    return Math.max(width, height) / Math.min(width, height);
  };

  const rows: GraphNode[][] = [children.slice()];
  let best: GraphNode[][] = rows.map((row) => row.slice());
  let bestCost = aspectRatio(rows);

  while (true) {
    const source = rows[rows.length - 1];
    if (source.length <= 1) break;

    const next: GraphNode[] = [];
    rows.push(next);

    while (source.length > 1) {
      next.unshift(source.pop()!);

      const cost = aspectRatio(rows);
      if (cost < bestCost) {
        bestCost = cost;
        best = rows.map((row) => row.slice());
      }

      // The new (bottom) row is now wider than the one above it: pulling more
      // would only worsen the aspect ratio, so break off a fresh row.
      if (getRowWidth(next, margin) > getRowWidth(source, margin)) {
        break;
      }
    }
    // A previous row is down to its last child; stop wrapping.
    if (source.length === 1) {
      break;
    }
  }

  return best;
}

export function QuantizedTreemap(root: GraphNodeBase) {
  eachAfter(root, (n) => {
    if (n.type === GraphNodeEnum.Code || n.type === GraphNodeEnum.Other) {
      n.bbox.width = size;
      n.bbox.height = size;
    } else if (n.type === GraphNodeEnum.Directory || n.type === GraphNodeEnum.Virtual) {
      if (n.children.length === 0) {
        n.bbox.x = 0;
        n.bbox.y = 0;
        n.bbox.width = 0;
        n.bbox.height = 0;
        return;
      }

      const rows = wrapIntoRows(n.children);

      let y = 0;
      rows.forEach((row) => {
        let x = 0;
        row.forEach((child) => {
          const diffX = x - child.bbox.x;
          const diffY = y - child.bbox.y;
          eachBefore(child, (descendant) => {
            descendant.bbox.x += diffX;
            descendant.bbox.y += diffY;
          });
          x += child.bbox.width + margin;
        });
        y += getRowHeight(row) + margin;
      });

      const { width, height } = getContainerSize(rows, margin);
      n.bbox.x = 0;
      n.bbox.y = 0;
      n.bbox.width = width;
      n.bbox.height = height;
    }
  });
}
