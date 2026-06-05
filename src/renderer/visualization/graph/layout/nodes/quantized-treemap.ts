import { eachAfter, eachBefore } from '../../utils';
import { GraphNode, GraphNodeBase, GraphNodeEnum } from '../../models';
import { alignRows, getContainerSize, getRowHeight, getRowWidth } from './utils';

const size = 120;
const margin = 24;
const padding = 48;

export function QuantizedTreemap(root: GraphNodeBase) {
  eachAfter(root, (n) => {
    // preprocessing
    if (n.type === GraphNodeEnum.Code || n.type === GraphNodeEnum.Other) {
      n.bbox.width = size;
      n.bbox.height = size;
      n.area = size;
      return;
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
      const nodeRows = wrapIntoRows(n.children);

      // 2. post-process fill up the top rows first
      // if (n.id === 'src/pages/home') debugger;
      const packedRows = fillRowsTopDown(nodeRows, getContainerSize(nodeRows, margin).width);
      n.bbox.x = 0;
      n.bbox.y = 0;
      n.bbox.width = packedRows.width;
      n.bbox.height = packedRows.height;
    }
  });
}

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
      if (currentAspectRatio <= tempAspectRatio) {
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

function fillRowsTopDown(
  rows: GraphNode[][],
  maxWidth: number
): { rows: GraphNode[][]; width: number; height: number } {
  const result: GraphNode[][] = [];
  let current: GraphNode[] = [];

  // break rows
  for (const row of rows) {
    for (const child of row) {
      if (current.length === 0 || getRowWidth([...current, child], margin) <= maxWidth) {
        current.push(child); // if fits in a row
      } else {
        result.push(current); // if doesn't fit, leave it as is
        current = [child];
      }
    }
  }
  if (current.length > 0) {
    result.push(current);
  }

  // calculate positions
  let y = padding;
  result.forEach((row) => {
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

  const { width, height } = getContainerSize(result, margin);

  return { rows: result, width: width + padding * 2, height: height + padding * 2 };
}
