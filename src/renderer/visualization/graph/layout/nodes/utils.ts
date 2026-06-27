import { GraphNodeBase, Size } from '../../models';

export function getContainerSize(rows: GraphNodeBase[][], padding = 0): Size {
  let width = 0;
  let height = 0;
  rows.forEach((row) => {
    width = Math.max(width, getRowWidth(row, padding));
    height += getRowHeight(row, padding);
  });
  return { width, height };
}

export function getRowWidth(row: GraphNodeBase[], padding = 0): number {
  let width = 0;
  for (const child of row) {
    width += child.bbox.width + child.margin.left + child.margin.right + padding * 2;
  }
  return width;
}

export function getRowHeight(row: GraphNodeBase[], padding = 0): number {
  let height = 0;
  for (const child of row) {
    height = Math.max(height, child.bbox.height + child.margin.top + child.margin.bottom + padding * 2);
  }
  return height;
}
