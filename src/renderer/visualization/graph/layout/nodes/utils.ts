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
// widths become as equal as possible. Mutates both arrays in place. Order is
// preserved: the boundary only ever shifts by moving the last node of `upper`
// down to the front of `lower`, or the first node of `lower` up to the end of
// `upper`. The width difference is V-shaped in the boundary position, so a
// greedy single-node walk reaches the optimum. Never empties a row.
export function alignRows(upper: GraphNode[], lower: GraphNode[], margin: number): void {
  const diff = () => Math.abs(getRowWidth(upper, margin) - getRowWidth(lower, margin));

  while (true) {
    const before = diff();
    if (getRowWidth(upper, margin) >= getRowWidth(lower, margin)) {
      if (upper.length <= 1) break;
      const node = upper.pop()!;
      lower.unshift(node);
      if (diff() >= before) {
        lower.shift();
        upper.push(node);
        break;
      }
    } else {
      if (lower.length <= 1) break;
      const node = lower.shift()!;
      upper.push(node);
      if (diff() >= before) {
        upper.pop();
        lower.unshift(node);
        break;
      }
    }
  }
}
