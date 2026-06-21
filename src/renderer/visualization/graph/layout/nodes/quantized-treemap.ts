import {
  DeclarationGraphNode,
  DirectoryGraphNode,
  GraphNode,
  GraphNodeBase,
  GraphNodeEnum,
  VirtualGraphNode
} from '../../models';
import { eachAfter, eachBefore } from '../../utils';
import { addCodeHeader, addDirectoryHeader } from './headers/header';
import { getContainerSize, getRowHeight, getRowWidth } from './utils';

const size = 100;
const locHeight = 5;
const getVarSize = (n: GraphNodeBase) =>
  size *
  (1 +
    (n.parent!.type === GraphNodeEnum.Virtual || n.parent!.children.length < 6
      ? Math.max(0, 3 - (n as DeclarationGraphNode).ast.depth)
      : 0));

export function QuantizedTreemap(root: GraphNodeBase) {
  eachAfter(root, (n) => {
    // preprocessing
    switch (n.type) {
      case GraphNodeEnum.Declaration: {
        const s = getVarSize(n);
        n.bbox.width = s;
        n.bbox.height = s; //Math.max(s, (n as DeclarationGraphNode).ast.loc * locHeight);
        n.area = Math.max(n.bbox.width, n.bbox.height);
        n.margin = { left: 0, top: 0, right: 0, bottom: 0 };
        n.padding = 0;
        break;
      }
      case GraphNodeEnum.Other: {
        const s = getVarSize(n);
        n.bbox.width = s;
        n.bbox.height = s;
        n.area = s;
        n.margin = { left: 0, top: 0, right: 0, bottom: 0 };
        n.padding = 0;
        break;
      }
      case GraphNodeEnum.Code: {
        n.area = n.children.reduce((sum, child) => sum + child.area, 0);
        n.padding = 40;
        n.margin = { left: 0, top: 0, right: 0, bottom: 0 };

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

        addCodeHeader(n);
        break;
      }
      case GraphNodeEnum.Virtual: {
        n.area = n.children.reduce((sum, child) => sum + child.area, 0);
        n.padding = 40;
        n.margin = { left: 0, top: 0, right: 0, bottom: 0 };

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
        break;
      }
      case GraphNodeEnum.Directory: {
        n.area = n.children.reduce((sum, child) => sum + child.area, 0);
        const dirMargin = Math.round(Math.sqrt(n.area));
        n.padding = Math.round(Math.sqrt(n.area));
        n.margin = { left: dirMargin, top: 24, right: dirMargin, bottom: 0 };

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

        // 3. stack nodes to waste less space
        wrapIntoColumns(packedRows.rows, n as DirectoryGraphNode);

        addDirectoryHeader(n);
        break;
      }
    }
  });
}

function wrapIntoRows(children: GraphNode[]): GraphNode[][] {
  if (children.length === 0) return [];

  const aspectRatio = (rows: GraphNode[][]): number => {
    const { width, height } = getContainerSize(rows);
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
        const upper = rows[i - 1];
        const lower = rows[i];
        const widthDiff = () => Math.abs(getRowWidth(upper) - getRowWidth(lower));

        while (true) {
          const before = widthDiff();
          if (getRowWidth(upper) >= getRowWidth(lower)) {
            if (upper.length <= 1) break;
            const node = upper.pop()!;
            lower.unshift(node);
            if (widthDiff() >= before) {
              lower.shift();
              upper.push(node);
              break;
            }
          } else {
            if (lower.length <= 1) break;
            const node = lower.shift()!;
            upper.push(node);
            if (widthDiff() >= before) {
              upper.pop();
              lower.unshift(node);
              break;
            }
          }
        }
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
  rows: GraphNode[][],
  maxWidth: number,
  padding: number
): { rows: GraphNode[][]; width: number; height: number } {
  const result: GraphNode[][] = [];
  let current: GraphNode[] = [];

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
      const whitespaceX = child.margin.left + padding;
      const whitespaceY = child.margin.top + padding;
      const diffX = x + whitespaceX - child.bbox.x;
      const diffY = y + whitespaceY - child.bbox.y;
      eachBefore(child, (descendant) => {
        descendant.bbox.x += diffX;
        descendant.bbox.y += diffY;
      });
      x += child.bbox.width + child.margin.left + child.margin.right + padding * 2; // todo refactor to use utils
    });
    y += rowHeight;
  });

  const { width, height } = getContainerSize(result, padding);

  return { rows: result, width, height };
}

function wrapIntoColumns(rows: GraphNode[][], parentNode: DirectoryGraphNode) {
  rows.forEach((row) => {
    const rowHeight = getRowHeight(row, parentNode.padding);
    for (let i = 1; i < row.length; i++) {
      // todo should really be a while loop with stack
      const prev = row[i - 1];
      const curr = row[i];
      const prevHeight = getRowHeight([prev], parentNode.padding);
      const currHeight = getRowHeight([curr], parentNode.padding);
      const prevWidth = getRowWidth([prev], parentNode.padding);
      const currWidth = getRowWidth([curr], parentNode.padding);

      // check if need to move nodes (from previous iteration)
      const freedWidth = curr.bbox.x - curr.margin.left - (prev.bbox.x + prevWidth);
      if (freedWidth > 0) {
        for (let j = i; j < row.length; j++) {
          const next = row[j];
          eachBefore(next, (c) => (c.bbox.x -= freedWidth));
        }
      }

      if (prevHeight + currHeight > rowHeight) {
        continue;
      }

      const diffX = prev.bbox.x - curr.bbox.x;
      const diffY = prev.bbox.y + prevHeight + curr.margin.top - curr.bbox.y;
      eachBefore(curr, (c) => {
        c.bbox.x += diffX;
        c.bbox.y += diffY;
      });

      let virtual: VirtualGraphNode;
      if (prev.type === GraphNodeEnum.Virtual && !prev.flags.isFilesContainer) {
        virtual = prev;
        prev.children.push(curr);
        prev.bbox.width = Math.max(prev.bbox.width, curr.bbox.width);
        prev.bbox.height = prevHeight + currHeight;
        row.splice(i, 1);
        const currIdx = parentNode.children.indexOf(curr);
        parentNode.children.splice(currIdx, 1);
      } else {
        virtual = VirtualGraphNode.create(`${i}/${parentNode.id}`, parentNode, { isColumn: true });
        virtual.children.push(prev, curr);
        virtual.bbox.x = prev.bbox.x;
        virtual.bbox.y = prev.bbox.y;
        virtual.bbox.width = Math.max(prev.bbox.width, curr.bbox.width);
        virtual.bbox.height = prevHeight + currHeight;
        row.splice(i - 1, 2, virtual);
        const prevIdx = parentNode.children.indexOf(prev);
        parentNode.children.splice(prevIdx, 2, virtual);
      }
      i--;
    }
  });

  const { width, height } = getContainerSize(rows, parentNode.padding);
  parentNode.bbox.width = width;
  parentNode.bbox.height = height;
  parentNode.area = Math.max(width, height);
}
