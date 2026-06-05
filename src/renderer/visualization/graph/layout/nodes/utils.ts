import { GraphNodeBase, Size } from '../../models';

export function getContainerSize(rows: GraphNodeBase[][], padding = 0): Size {
  let width = 0;
  let height = 0;
  rows.forEach((row) => {
    width = Math.max(width, getRowWidth(row, padding));
    height += getRowHeight(row, padding);
  });
  return { width, height }
}

export function getRowWidth(row: GraphNodeBase[], padding = 0): number {
  let width = 0;
  for (const child of row) width += getSlotWidth(child, padding);
  return width;
}

export function getRowHeight(row: GraphNodeBase[], padding = 0): number {
  let height = 0;
  for (const child of row) height = Math.max(height, getSlotHeight(child, padding));
  return height;
}

export function getSlotWidth(node: GraphNodeBase, padding = 0): number {
  return node.bbox.width + (node.margin + padding) * 2;
}

export function getSlotHeight(node: GraphNodeBase, padding = 0): number {
  return node.bbox.height + (node.margin + padding) * 2;
}

// Move nodes across the boundary between two vertically adjacent rows so their
// widths become as equal as possible.
export function alignRows(upper: GraphNodeBase[], lower: GraphNodeBase[]): void {
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
