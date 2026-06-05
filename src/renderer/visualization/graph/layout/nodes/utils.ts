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
