import { eachAfter, eachBefore } from '../../utils';
import { GraphNode, GraphNodeBase, GraphNodeEnum } from '../../models';
import { alignRows, getContainerSize, getRowHeight, getRowWidth } from './utils';

const size = 120;
const margin = 24;
const padding = 48;

function wrapIntoRows(children: GraphNode[]): GraphNode[][] {
  const aspectRatio = (rows: GraphNode[][]): number => {
    const { width, height } = getContainerSize(rows, margin);
    return Math.max(width, height) / Math.min(width, height);
  };

  const rows: GraphNode[][] = [children.slice()];
  let best: GraphNode[][] = [children.slice()];
  let tempAspectRatio = aspectRatio(rows);

  while (true) {
    const source = rows[rows.length - 1];
    if (source.length < 2) {
      break;
    }
    const next: GraphNode[] = [];
    rows.push(next);

    while (source.length > 1) {
      next.unshift(source.pop()!);

      // rebalance previous rows
      for (let i = rows.length - 2; i >= 1; i--) {
        alignRows(rows[i - 1], rows[i], margin);
      }

      const currentAspectRatio = aspectRatio(rows);
      if (currentAspectRatio < tempAspectRatio) {
        tempAspectRatio = currentAspectRatio;
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
    // preprocessing
    if (n.type === GraphNodeEnum.Code || n.type === GraphNodeEnum.Other) {
      n.bbox.width = size;
      n.bbox.height = size;
      n.area = size;
    } else if (n.type === GraphNodeEnum.Directory || n.type === GraphNodeEnum.Virtual) {
      n.area = n.children.reduce((sum, child) => sum + child.area, 0);

      if (n.children.length === 0) {
        n.bbox.x = 0;
        n.bbox.y = 0;
        n.bbox.width = 0;
        n.bbox.height = 0;
        return;
      }

      // 1. rows layout
      // if (n.id === '/src/ui/templates' && n.type === GraphNodeEnum.Virtual) debugger;
      const nodeRows = wrapIntoRows(n.children);

      let y = padding;
      nodeRows.forEach((row) => {
        let x = padding;
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

      const { width, height } = getContainerSize(nodeRows, margin);
      n.bbox.x = 0;
      n.bbox.y = 0;
      n.bbox.width = width + padding * 2;
      n.bbox.height = height + padding * 2;
    }

    // 2. aspect ratio optimizer
  });
}
