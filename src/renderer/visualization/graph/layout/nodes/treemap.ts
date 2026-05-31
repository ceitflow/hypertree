import { eachAfter, eachBefore } from '../../utils';
import { CodeGraphNode, DeclarationGraphNode, GraphNodeBase, OtherGraphNode } from '../../models';

function precalculate(root: GraphNodeBase) {
  eachAfter(root, (v) => {
    if (v instanceof CodeGraphNode || v instanceof DeclarationGraphNode || v instanceof OtherGraphNode) {
      v.treeMapValue = v.ast.loc;
    } else {
      v.children.forEach((c) => (v.treeMapValue += c.treeMapValue));
    }
  });
}

export function Treemap(root: GraphNodeBase) {
  precalculate(root);

  const pad = 3000;
  const padding = (node: GraphNodeBase): number => pad;
  const paddingTop = padding;
  const paddingRight = padding;
  const paddingBottom = padding;
  const paddingLeft = padding;

  // todo run 2 times, without padding and then having padding

  root.bbox.x = 0;
  root.bbox.y = 0;
  root.bbox.width = 80000;
  root.bbox.height = 80000;

  const paddingStack = [0];
  let smallestW = Infinity;
  let smallestH = Infinity;

  eachBefore(root, (node) => {
    if (node !== root) {
      node.depth = node.parent!.depth + 1;
    }
    let p = paddingStack[node.depth];
    let leftX = node.bbox.x + p;
    let topY = node.bbox.y + p;
    let rightX = node.bbox.width - p;
    let bottomY = node.bbox.height - p;

    if (rightX < leftX) leftX = rightX = (leftX + rightX) / 2;
    if (bottomY < topY) topY = bottomY = (topY + bottomY) / 2;

    node.bbox.x = leftX;
    node.bbox.y = topY;
    node.bbox.width = rightX;
    node.bbox.height = bottomY;

    if (node.children.length) {
      p = paddingStack[node.depth + 1] = padding(node) / 2;
      leftX += paddingLeft(node) - p;
      topY += paddingTop(node) - p;
      rightX -= paddingRight(node) - p;
      bottomY -= paddingBottom(node) - p;
      if (rightX < leftX) {
        leftX = rightX = (leftX + rightX) / 2;
        rightX += 1;
      }
      if (bottomY < topY) {
        topY = bottomY = (topY + bottomY) / 2;
        bottomY += 1;
      }
      squarifyRatio(node, leftX, topY, rightX, bottomY);
      smallestW = Math.min(smallestW, node.bbox.width - node.bbox.x);
      smallestH = Math.min(smallestH, node.bbox.height - node.bbox.y);
    }
  });

  eachBefore(root, (v) => {
    v.bbox.width = v.bbox.width - v.bbox.x;
    v.bbox.height = v.bbox.height - v.bbox.y;
  });
}

type Row = { value: number; dice: boolean; children: GraphNodeBase[] };

function squarifyRatio(parent: GraphNodeBase, leftX: number, topY: number, rightX: number, bottomY: number) {
  const phi = (1 + Math.sqrt(5)) / 2;
  const nodes = parent.children;
  const childrenLength = nodes.length;
  let row: Row;
  let nodeValue: number;
  let i0 = 0;
  let i1 = 0;
  let dx: number;
  let dy: number;
  let value = parent.treeMapValue;

  while (i0 < childrenLength) {
    let sumValue: number;
    let minValue: number;
    let maxValue: number;
    let newRatio: number;
    let minRatio: number;
    let alpha: number;
    let beta: number;

    dx = rightX - leftX;
    dy = bottomY - topY;

    // Find the next non-empty node.
    do {
      sumValue = nodes[i1++].treeMapValue;
    } while (!sumValue && i1 < childrenLength);

    minValue = maxValue = sumValue;
    alpha = Math.max(dy / dx, dx / dy) / (value * phi);
    beta = sumValue * sumValue * alpha;
    minRatio = Math.max(maxValue / beta, beta / minValue);

    // Keep adding nodes while the aspect ratio maintains or improves.
    for (; i1 < childrenLength; ++i1) {
      sumValue += nodeValue = nodes[i1].treeMapValue;
      if (nodeValue < minValue) minValue = nodeValue;
      if (nodeValue > maxValue) maxValue = nodeValue;
      beta = sumValue * sumValue * alpha;
      newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= nodeValue;
        break;
      }
      minRatio = newRatio;
    }

    // Position and record the row orientation.
    row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) };
    if (row.dice) {
      treemapDice(row, leftX, topY, rightX, value ? (topY += (dy * sumValue) / value) : bottomY);
    } else {
      treemapSlice(row, leftX, topY, value ? (leftX += (dx * sumValue) / value) : rightX, bottomY);
    }
    value -= sumValue;
    i0 = i1;
  }
}

function treemapDice(parent: Row, leftX: number, topY: number, rightX: number, bottomY: number) {
  let nodes = parent.children;
  let node: GraphNodeBase;
  let i = -1;
  let n = nodes.length;
  let k = parent.value && (rightX - leftX) / parent.value;

  while (++i < n) {
    node = nodes[i];
    node.bbox.y = topY;
    node.bbox.height = bottomY;
    node.bbox.x = leftX;
    node.bbox.width = leftX += node.treeMapValue * k;
  }
}

function treemapSlice(parent: Row, leftX: number, topY: number, rightX: number, bottomY: number) {
  const nodes = parent.children;
  let node: GraphNodeBase;
  let i = -1;
  const k = parent.value && (bottomY - topY) / parent.value;

  while (++i < nodes.length) {
    node = nodes[i];
    node.bbox.x = leftX;
    node.bbox.width = rightX;
    node.bbox.y = topY;
    node.bbox.height = topY += node.treeMapValue * k;
  }
}

function binaryTiling(root: GraphNodeBase, leftX: number, topY: number, rightX: number, bottomY: number) {
  const nodes = root.children;
  const childrenCount = nodes.length;
  const sums: number[] = new Array(childrenCount + 1);
  let sum = 0;
  sums[0] = 0;

  for (let i = 0; i < childrenCount; i++) {
    sum += nodes[i].treeMapValue;
    sums[i + 1] = sum;
  }
  partition(0, childrenCount, sums, nodes, root.treeMapValue, leftX, topY, rightX, bottomY);
}

function partition(
  index: number,
  childrenLength: number,
  sums: number[],
  nodes: GraphNodeBase[],
  treeMapValue: number,
  leftX: number,
  topY: number,
  rightX: number,
  bottomY: number
) {
  // if last child
  if (index === childrenLength - 1) {
    const node = nodes[index];
    node.bbox.x = leftX;
    node.bbox.y = topY;
    node.bbox.width = rightX;
    node.bbox.height = bottomY;
    return;
  }

  const valueOffset = sums[index];
  const valueTarget = treeMapValue / 2 + valueOffset;
  let k = index + 1;
  let hi = childrenLength - 1;

  while (k < hi) {
    const mid = (k + hi) >>> 1;
    if (sums[mid] < valueTarget) {
      k = mid + 1;
    } else hi = mid;
  }

  if (valueTarget - sums[k - 1] < sums[k] - valueTarget && index + 1 < k) --k;

  const valueLeft = sums[k] - valueOffset;
  const valueRight = treeMapValue - valueLeft;

  if (rightX - leftX > bottomY - topY) {
    const xk = treeMapValue ? (leftX * valueRight + rightX * valueLeft) / treeMapValue : rightX;
    partition(index, k, sums, nodes, valueLeft, leftX, topY, xk, bottomY);
    partition(k, childrenLength, sums, nodes, valueRight, xk, topY, rightX, bottomY);
  } else {
    const yk = treeMapValue ? (topY * valueRight + bottomY * valueLeft) / treeMapValue : bottomY;
    partition(index, k, sums, nodes, valueLeft, leftX, topY, rightX, yk);
    partition(k, childrenLength, sums, nodes, valueRight, leftX, yk, rightX, bottomY);
  }
}
