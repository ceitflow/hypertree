import { GraphNode } from '../../models';

export function getContainerSize(rows: GraphNode[][], margin: number): { width: number; height: number } {
  let width = 0;
  let height = 0;
  rows.forEach((row, i) => {
    width = Math.max(width, getRowWidth(row, margin));
    height += getRowHeight(row);
    if (i > 0) height += margin;
  });
  return { width, height };
}

export function getRowWidth(row: GraphNode[], margin: number): number {
  if (row.length === 0) return 0;
  let width = -margin;
  for (const child of row) width += child.bbox.width + margin;
  return width;
}

export function getRowHeight(row: GraphNode[]): number {
  let height = 0;
  for (const child of row) height = Math.max(height, child.bbox.height);
  return height;
}

// Move nodes across the boundary between two vertically adjacent rows so their
// widths become as equal as possible.
export function alignRows(upper: GraphNode[], lower: GraphNode[], margin: number): void {
  const widthDiff = () => Math.abs(getRowWidth(upper, margin) - getRowWidth(lower, margin));

  while (true) {
    const before = widthDiff();
    if (getRowWidth(upper, margin) >= getRowWidth(lower, margin)) {
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
