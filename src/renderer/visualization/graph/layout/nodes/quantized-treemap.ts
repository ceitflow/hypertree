import { eachAfter, eachBefore } from '../../utils';
import { GraphNodeBase, GraphNodeEnum } from '../../models';
import { alignRows, getContainerSize, getRowHeight, getRowWidth } from './utils';

const size = 120;

export function QuantizedTreemap(root: GraphNodeBase) {
  eachAfter(root, (n) => {
    // preprocessing
    switch (n.type) {
      case GraphNodeEnum.Declaration:
      case GraphNodeEnum.Other: {
        n.bbox.width = size;
        n.bbox.height = size;
        n.area = size;
        n.margin = 0;
        n.padding = 0;
        break;
      }
      case GraphNodeEnum.Code:
      case GraphNodeEnum.Directory:
      case GraphNodeEnum.Virtual: {
        n.area = n.children.reduce((sum, child) => sum + child.area, 0);
        n.padding = 20;
        n.margin = n.type === GraphNodeEnum.Directory ? Math.max(400 - n.depth * 40, 40) : 0;

        if (n.children.length === 0) {
          n.bbox.x = 0;
          n.bbox.y = 0;
          n.bbox.width = size;
          n.bbox.height = size;
          n.area = size;
          return;
        }

        // 1. rows layout
        const nodeRows = wrapIntoRows(n.children);

        // 2. post-process fill up the top rows first
        // if (n.id === 'src/pages/home') debugger;
        const packedRows = fillRowsTopDown(nodeRows, getContainerSize(nodeRows).width, n.padding);
        n.bbox.x = 0;
        n.bbox.y = 0;
        n.bbox.width = packedRows.width;
        n.bbox.height = packedRows.height;
        break;

        // todo 2.5 skyline packing algorithm approach, check row line and see if a node can be pushed into it
      }
    }
  });
}

function wrapIntoRows(children: GraphNodeBase[]): GraphNodeBase[][] {
  const aspectRatio = (rows: GraphNodeBase[][]): number => {
    const { width, height } = getContainerSize(rows);
    return Math.max(width, height) / Math.min(width, height);
  };

  const rows: GraphNodeBase[][] = [children.slice()];
  let best: GraphNodeBase[][] = [children.slice()];
  let tempAspectRatio = aspectRatio(rows);

  while (true) {
    const source = rows[rows.length - 1];
    if (source.length < 2) {
      break;
    }
    const next: GraphNodeBase[] = [];
    rows.push(next);

    while (source.length > 1) {
      next.unshift(source.pop()!);

      // rebalance previous rows
      for (let i = rows.length - 2; i >= 1; i--) {
        alignRows(rows[i - 1], rows[i]);
      }

      const currentAspectRatio = aspectRatio(rows);
      if (currentAspectRatio <= tempAspectRatio) {
        tempAspectRatio = currentAspectRatio;
        best = rows.map((row) => row.slice());
      }

      // The new (bottom) row is now wider than the one above it: pulling more
      // would only worsen the aspect ratio, so break off a fresh row.
      if (getRowWidth(next) > getRowWidth(source)) {
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
  rows: GraphNodeBase[][],
  maxWidth: number,
  padding: number
): { rows: GraphNodeBase[][]; width: number; height: number } {
  const result: GraphNodeBase[][] = [];
  let current: GraphNodeBase[] = [];

  // break rows
  for (const row of rows) {
    for (const child of row) {
      if (current.length === 0 || getRowWidth([...current, child]) <= maxWidth) {
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
  let y = 0;
  result.forEach((row) => {
    let x = 0;
    row.forEach((child) => {
      const space = child.margin + padding;
      const diffX = x + space - child.bbox.x;
      const diffY = y + space - child.bbox.y;
      eachBefore(child, (descendant) => {
        descendant.bbox.x += diffX;
        descendant.bbox.y += diffY;
      });
      x += child.bbox.width + space * 2;
    });
    y += getRowHeight(row, padding);
  });

  const { width, height } = getContainerSize(result, padding);

  return { rows: result, width, height };
}
