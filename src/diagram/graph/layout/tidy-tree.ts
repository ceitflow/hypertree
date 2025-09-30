import { LayoutModel } from '../types.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.
// Later on create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
export function TidyTree(root: LayoutModel): { left: LayoutModel; right: LayoutModel, totalDepth: number } {
  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  // first walk
  eachAfter(root, (v: LayoutModel) => {
    const children = v.children;
    const siblings = v.parent!.children;
    const leftSibling = v.layout.i ? siblings[v.layout.i - 1] : null;
    if (children.length) {
      executeShifts(v);
      const midpoint = (children[0].layout.prelim + children[children.length - 1].layout.prelim) / 2;
      if (leftSibling) {
        v.layout.prelim = leftSibling.layout.prelim + separation(v, leftSibling);
        v.layout.mod = v.layout.prelim - midpoint;
      } else {
        v.layout.prelim = midpoint;
      }
    } else if (leftSibling) {
      v.layout.prelim = leftSibling.layout.prelim + separation(v, leftSibling);
    }
    v.parent!.layout.Ancestor = apportion(v, leftSibling, v.parent!.layout.Ancestor || siblings[0]);
  });
  root.parent!.layout.mod = -root.layout.prelim; // edge case for root node to move it upward

  // Computes all real x-coordinates by summing up the modifiers recursively.
  // second walk
  let left = root;
  let right = root;
  let bottom = root;
  let totalDepth = 0;

  eachBefore(root, (v: LayoutModel) => {
    v.layout.x = v.layout.prelim + v.parent!.layout.mod;
    v.layout.angle = v.layout.x;
    v.layout.mod += v.parent!.layout.mod;
    v.layout.y = v.layout.depth * 160;
    const depth = v.layout.depth;
    if (depth > totalDepth) totalDepth = depth;

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.layout.x < left.layout.x) left = v;
    if (v.layout.x > right.layout.x) right = v;
    if (v.layout.depth > bottom.layout.depth) bottom = v;
  });

  return { left, right, totalDepth };
}

export function separation(a: LayoutModel, b: LayoutModel) {
  return 12;
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
function apportion(currentNode: LayoutModel, leftSibling: LayoutModel | null, defaultAncestor: LayoutModel): LayoutModel {
  if (leftSibling) {
    let insideRightNode = currentNode;
    let outsideRightNode = currentNode;
    let insideLeftNode = leftSibling;
    let outsideLeftNode = insideRightNode.parent!.children[0];

    let insideRightModSum = insideRightNode.layout.mod;
    let outsideRightModSum = outsideRightNode.layout.mod;
    let insideLeftModSum = insideLeftNode.layout.mod;
    let outsideLeftModSum = outsideLeftNode.layout.mod;
    let shift: number;

    while (
      ((insideLeftNode = nextRight(insideLeftNode)!),
      (insideRightNode = nextLeft(insideRightNode)!),
      insideLeftNode && insideRightNode)
    ) {
      outsideLeftNode = nextLeft(outsideLeftNode)!;
      outsideRightNode = nextRight(outsideRightNode)!;
      outsideRightNode.layout.ancestor = currentNode;
      shift = insideLeftNode.layout.prelim + insideLeftModSum - insideRightNode.layout.prelim - insideRightModSum + separation(insideLeftNode, insideRightNode);
      if (shift > 0) {
        moveSubtree(nextAncestor(insideLeftNode, currentNode, defaultAncestor), currentNode, shift);
        insideRightModSum += shift;
        outsideRightModSum += shift;
      }
      insideLeftModSum += insideLeftNode.layout.mod;
      insideRightModSum += insideRightNode.layout.mod;
      outsideLeftModSum += outsideLeftNode.layout.mod;
      outsideRightModSum += outsideRightNode.layout.mod;
    }

    if (insideLeftNode && !nextRight(outsideRightNode)) {
      outsideRightNode.layout.thread = insideLeftNode;
      outsideRightNode.layout.mod += insideLeftModSum - outsideRightModSum;
    }

    if (insideRightNode && !nextLeft(outsideLeftNode)) {
      outsideLeftNode.layout.thread = insideRightNode;
      outsideLeftNode.layout.mod += insideRightModSum - outsideLeftModSum;
      defaultAncestor = currentNode;
    }
  }
  return defaultAncestor;
}

export function eachAfter(root: LayoutModel, callback: (node: LayoutModel) => void): void {
  const nodes: LayoutModel[] = [root];
  const next: LayoutModel[] = [];
  let node: LayoutModel | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  while (next.length) callback(next.pop()!);
}

export function eachBefore(root: LayoutModel | LayoutModel[], callback: (node: LayoutModel) => void): void {
  const nodes: LayoutModel[] = Array.isArray(root) ? [...root] : [root];
  let node: LayoutModel | undefined;

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
function nextLeft(v: LayoutModel): LayoutModel | null {
  const children = v.children;
  return children.length ? children[0] : v.layout.thread;
}

// This function works analogously to nextLeft.
function nextRight(v: LayoutModel): LayoutModel | null {
  const children = v.children;
  return children.length ? children[children.length - 1] : v.layout.thread;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: LayoutModel, wp: LayoutModel, shift: number): void {
  const change = shift / (wp.layout.i - wm.layout.i);
  wp.layout.change -= change;
  wp.layout.shift += shift;
  wm.layout.change += change;
  wp.layout.prelim += shift;
  wp.layout.mod += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
export function executeShifts(v: LayoutModel): void {
  let shift = 0;
  let change = 0;
  const children = v.children;
  if (!children.length) return;

  let i = children.length;
  let w: LayoutModel;
  while (--i >= 0) {
    w = children[i];
    w.layout.prelim += shift;
    w.layout.mod += shift;
    shift += w.layout.shift + (change += w.layout.change);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: LayoutModel, v: LayoutModel, ancestor: LayoutModel): LayoutModel {
  return vim.layout.ancestor.parent === v.parent ? vim.layout.ancestor : ancestor;
}
