import { addHeader } from './header';
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
      case GraphNodeEnum.Virtual: {
        n.area = n.children.reduce((sum, child) => sum + child.area, 0);
        n.padding = 40;
        n.margin = 0;

        if (n.children.length === 0) {
          n.bbox.width = size;
          n.bbox.height = size;
          n.area = size;
          return;
        }
        // 1. rows layout
        const nodeRows = wrapIntoRows(n.children);

        // 2. post-process fill up the top rows first
        const packedRows = fillRowsTopDown(nodeRows, getContainerSize(nodeRows).width, n.padding);
        n.rows = packedRows.rows;
        n.bbox.width = packedRows.width;
        n.bbox.height = packedRows.height;

        if (n.type === GraphNodeEnum.Code) {
          addHeader(n, 40);
        }
        break;
      }
      case GraphNodeEnum.Directory: {
        n.area = n.children.reduce((sum, child) => sum + child.area, 0);
        n.padding = 40;
        n.margin = Math.round(Math.sqrt(n.area));

        if (n.children.length === 0) {
          n.bbox.width = size;
          n.bbox.height = size;
          n.area = size;
          return;
        }

        // pull the virtual container for files first
        let virtual: GraphNodeBase | null = null;
        const originalChildren = n.children;
        if (n.children[0].type === GraphNodeEnum.Virtual) {
          virtual = n.children[0];
          n.children = n.children.slice(1);
        }

        // 1. rows layout
        const nodeRows = wrapIntoRows(n.children);

        // 2. post-process fill up the top rows first
        const packedRows = fillRowsTopDown(nodeRows, getContainerSize(nodeRows).width, n.padding);
        n.rows = packedRows.rows;
        n.bbox.width = packedRows.width;
        n.bbox.height = packedRows.height;

        if (virtual) {
          placeVirtualOnTop(n, virtual);
          n.children = originalChildren;
        }
        addHeader(n, Math.max(Math.round(n.bbox.height * 0.05), 300));
        break;
      }
    }
  });
}

function placeVirtualOnTop(parent: GraphNodeBase, virtual: GraphNodeBase): void {
  const whitespace = virtual.margin + parent.padding;

  // If the directory ended up wider than the virtual, re-pack the virtual's rows
  const innerMaxWidth = parent.bbox.width - whitespace * 2;
  if (virtual.rows.length > 1 && innerMaxWidth > virtual.bbox.width) {
    const repacked = fillRowsTopDown(virtual.rows, innerMaxWidth, virtual.padding);
    virtual.rows = repacked.rows;
    virtual.bbox.width = repacked.width;
    virtual.bbox.height = repacked.height;
  }

  const width = Math.max(parent.bbox.width, virtual.bbox.width + whitespace * 2);
  virtual.bbox.width = width - whitespace * 2;
  const virtualRowHeight = virtual.bbox.height + whitespace * 2;

  // Move the virtual (and its subtree) into the top-left content slot.
  const diffX = whitespace - virtual.bbox.x;
  const diffY = whitespace - virtual.bbox.y;
  eachBefore(virtual, (descendant) => {
    descendant.bbox.x += diffX;
    descendant.bbox.y += diffY;
  });

  // Push every other child (and its subtree) below the virtual row.
  parent.children.forEach((child) => {
    eachBefore(child, (descendant) => {
      descendant.bbox.y += virtualRowHeight;
    });
  });

  parent.bbox.width = width;
  parent.bbox.height += virtualRowHeight;
}

function wrapIntoRows(children: GraphNodeBase[]): GraphNodeBase[][] {
  if (children.length === 0) return [];

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
    const rowHeight = getRowHeight(row, padding);
    let x = 0;
    row.forEach((child) => {
      const whitespace = child.margin + padding;
      const diffX = x + whitespace - child.bbox.x;
      const diffY = y + whitespace - child.bbox.y;
      eachBefore(child, (descendant) => {
        descendant.bbox.x += diffX;
        descendant.bbox.y += diffY;
      });
      x += child.bbox.width + whitespace * 2;
    });
    y += rowHeight;
  });

  const { width, height } = getContainerSize(result, padding);

  return { rows: result, width, height };
}
