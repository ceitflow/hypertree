import { NodeModel } from '../types.ts';
import { EjectNodeDiameter, LayoutFactory, NodeDiameter } from './layout-factory.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.
// Later on create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
const RADIUS_STEP = 200;
const RADIUS_OFFSET = 100;

export function Separation(a: NodeModel, b: NodeModel) {
  const aSep = a.isEjected ? EjectNodeDiameter / 2 : NodeDiameter / 2;
  const bSep = b.isEjected ? EjectNodeDiameter / 2 : NodeDiameter / 2;
  return aSep + bSep;
}

export function Radius(depth: number): number {
  if (depth < 0) throw new Error('depth must be a positive integer');
  if (depth === 0) return 0;

  const MinDepthDistance = 24;

  let result = RADIUS_OFFSET;
  for (let i = 0; i < depth; i++) result += Math.floor(Math.max(RADIUS_STEP * Math.pow(2 / 3, i), MinDepthDistance));
  return result;
}

type Options = {
  mode?: 'horizontal' | 'radial';
};

export function TidyTree(root: NodeModel, opt: Options = {}) {
  addVirtualWallNodes(root);
  const map = new Map<number, NodeModel[]>();

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  // first walk
  eachAfter(root, (v: NodeModel) => {
    const children = v.children;
    const siblings = v.parent?.children || [];
    const leftSibling = v.i ? siblings[v.i - 1] : null;
    if (children.length) {
      executeShifts(v);
      const midpoint = (children[0].prelim + children[children.length - 1].prelim) / 2;
      if (leftSibling) {
        v.prelim = leftSibling.prelim + Separation(v, leftSibling);
        v.mod = v.prelim - midpoint;
      } else {
        v.prelim = midpoint;
      }
    } else if (leftSibling) {
      v.prelim = leftSibling.prelim + Separation(v, leftSibling);
    }

    if (v.parent) v.parent!.Ancestor = apportion(v, leftSibling, v.parent!.Ancestor || siblings[0]);
    v.totalWidth =
      children.length && !children[0].isVirtual ? children.reduce((acc, curr) => acc + curr.totalWidth, 0) : v.diameter;
  });

  // root.parent!.mod = -root.prelim; // edge case for root node to move it upward

  // Computes all real x-coordinates by summing up the modifiers recursively.
  // second walk
  let left = root;
  let right = root;
  let bottom = root;

  eachBefore(root, (v: NodeModel) => {
    const parentMod = v.parent?.mod || 0;
    v.x = v.prelim + parentMod;
    v.angle = v.x;
    v.mod += parentMod;
    v.y = Radius(v.depth);

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.x < left.x) left = v;
    if (v.x > right.x) right = v;
    if (v.depth > bottom.depth) bottom = v;
    if (v.parent && v.isVirtual)
      v.parent.children = []; // remove virtual wall nodes
    else {
      if (map.get(v.depth)) map.get(v.depth)!.push(v);
      else map.set(v.depth, [v]);
    }
  });

  // final positions calculation
  const sep = left === right ? 1 : Separation(left, right); // extra separation to prevent overlaps on same levels (start and end nodes)
  const fullWidth = right.x - left.x + sep;
  // console.log(`${root.name} leftmost: ${left.name}, rightmost: ${right.name}, fullWidth: ${fullWidth}`, map);

  const fullCircle = 2 * Math.PI;
  const tx = sep - left.x;
  const kx = fullCircle / fullWidth;
  const minRequiredRadius = fullWidth / Math.PI / 2;
  console.log(`TidyTree run, minRadius: ${minRequiredRadius}`);

  map.forEach((nodes, depth) => {
    const radius = Radius(depth);
    const ratio = radius / minRequiredRadius || 1; // >1
    console.log(`${depth}. radius: ${radius}, ratio: ${ratio}, width: ${nodes[nodes.length - 1].x - nodes[0].x}`);

    nodes.forEach(node => {
      if (opt.mode === 'radial') {
        if (node.parent) {
          const center = node.parent.x;
          node.angleAdjustment = ((node.x - center) / ratio + center - node.x) + node.parent.angleAdjustment;
        }
        node.angle = (node.x + node.angleAdjustment + tx) * kx - Math.PI / 2; // radians
        node.polarX = node.y * Math.cos(node.angle);
        node.polarY = node.y * Math.sin(node.angle);
      } else {
        node.polarX = node.x;
        node.polarY = node.y;
      }
    });
  });
  console.log('\n');
}

// adds 'virtual' nodes to leftmost and rightmost leaves of each parent to prevent subtrees from overlapping
function addVirtualWallNodes(root: NodeModel) {
  const leafs: NodeModel[] = [];
  const temp: NodeModel[] = [root];
  let totalDepth = 0;

  while (temp.length) {
    const node = temp.pop()!;
    if (!node.children.length) {
      leafs.push(node);
      totalDepth = Math.max(totalDepth, node.depth);
    } else for (let i = 0; i < node.children.length; i++) temp.push(node.children[i]);
  }

  while (leafs.length) {
    const n = leafs.pop()!;
    const isLeftOrRight = n.i === 0 || n.i === n.parent!.children.length - 1;
    if (!isLeftOrRight) continue;

    let tempVirtualNode!: NodeModel;
    // add virtual nodes all the way to the bottom
    for (let i = n.depth + 1; i <= totalDepth; i++) {
      if (!tempVirtualNode) {
        tempVirtualNode = LayoutFactory.createNode(n.ref, '', n.radialId, n, { isVirtual: true });
        n.children.push(tempVirtualNode);
        continue;
      }
      const c = LayoutFactory.createNode(n.ref, '', n.radialId, tempVirtualNode, { isVirtual: true });
      c.depth = i;
      tempVirtualNode.children.push(c);
      tempVirtualNode = c;
    }
  }
}

// Computes all real x-coordinates by summing up the modifiers recursively.
// The core of the algorithm. Here, a new subtree is combined with the
// previous subtrees. Threads are used to traverse the inside and outside
// contours of the left and right subtree up to the highest common level. The
// vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
// superscript o means outside and i means inside, the subscript - means left
// subtree and + means right subtree. For summing up the modifiers along the
// contour, we use respective variables si+, si-, so-, and so+. Whenever two
// nodes of the inside contours conflict, we compute the left one of the
// greatest uncommon ancestors using the function ANCESTOR and call MOVE
// SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
// Finally, we add a new thread (if necessary).
function apportion(currentNode: NodeModel, leftSibling: NodeModel | null, defaultAncestor: NodeModel): NodeModel {
  if (leftSibling) {
    let insideRightNode = currentNode;
    let outsideRightNode = currentNode;
    let insideLeftNode = leftSibling;
    let outsideLeftNode = insideRightNode.parent!.children[0];

    let insideRightModSum = insideRightNode.mod;
    let outsideRightModSum = outsideRightNode.mod;
    let insideLeftModSum = insideLeftNode.mod;
    let outsideLeftModSum = outsideLeftNode.mod;
    let shift: number;

    while (
      ((insideLeftNode = nextRight(insideLeftNode)!),
      (insideRightNode = nextLeft(insideRightNode)!),
      insideLeftNode && insideRightNode)
    ) {
      outsideLeftNode = nextLeft(outsideLeftNode)!;
      outsideRightNode = nextRight(outsideRightNode)!;
      outsideRightNode.ancestor = currentNode;
      shift =
        insideLeftNode.prelim +
        insideLeftModSum -
        insideRightNode.prelim -
        insideRightModSum +
        Separation(insideLeftNode, insideRightNode);
      if (shift > 0) {
        moveSubtree(nextAncestor(insideLeftNode, currentNode, defaultAncestor), currentNode, shift);
        insideRightModSum += shift;
        outsideRightModSum += shift;
      }
      insideLeftModSum += insideLeftNode.mod;
      insideRightModSum += insideRightNode.mod;
      outsideLeftModSum += outsideLeftNode.mod;
      outsideRightModSum += outsideRightNode.mod;
    }

    if (insideLeftNode && !nextRight(outsideRightNode)) {
      outsideRightNode.thread = insideLeftNode;
      outsideRightNode.mod += insideLeftModSum - outsideRightModSum;
    }

    if (insideRightNode && !nextLeft(outsideLeftNode)) {
      outsideLeftNode.thread = insideRightNode;
      outsideLeftNode.mod += insideRightModSum - outsideLeftModSum;
      defaultAncestor = currentNode;
    }
  }
  return defaultAncestor;
}

function eachAfter(root: NodeModel, callback: (node: NodeModel) => void): void {
  const nodes: NodeModel[] = [root];
  const next: NodeModel[] = [];
  let node: NodeModel | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  while (next.length) callback(next.pop()!);
}

export function eachBefore(root: NodeModel | NodeModel[], callback: (node: NodeModel) => void): void {
  const nodes: NodeModel[] = Array.isArray(root) ? [...root] : [root];
  let node: NodeModel | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    callback(node);
    for (let i = node.children.length - 1; i >= 0; i--) nodes.push(node.children[i]);
  }
}

/* This function is used to traverse the left contour of a subtree (or
   subforest). It returns the successor of v on this contour. This successor is
   either given by the leftmost child of v or by the thread of v. The function
   returns null if and only if v is on the highest level of its subtree. */
function nextLeft(v: NodeModel): NodeModel | null {
  const children = v.children;
  return children.length ? children[0] : v.thread;
}

// This function works analogously to nextLeft.
function nextRight(v: NodeModel): NodeModel | null {
  const children = v.children;
  return children.length ? children[children.length - 1] : v.thread;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: NodeModel, wp: NodeModel, shift: number): void {
  const change = shift / (wp.i - wm.i);
  wp.change -= change;
  wp.shift += shift;
  wm.change += change;
  wp.prelim += shift;
  wp.mod += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
function executeShifts(v: NodeModel): void {
  let shift = 0;
  let change = 0;
  const children = v.children;
  if (!children.length) return;

  let i = children.length;
  let w: NodeModel;
  while (--i >= 0) {
    w = children[i];
    w.prelim += shift;
    w.mod += shift;
    shift += w.shift + (change += w.change);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: NodeModel, v: NodeModel, ancestor: NodeModel): NodeModel {
  return vim.ancestor.parent === v.parent ? vim.ancestor : ancestor;
}
