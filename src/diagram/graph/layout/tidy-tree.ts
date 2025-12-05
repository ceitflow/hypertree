import { NodeModel, TidyNode } from '../types.ts';
import { NodeFactory, SpiralArmWidth } from './node-factory.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.

function Separation(left: TidyNode, right: TidyNode) {
  return left.width // / 2 + right.width / 2;
}

export function YPosition(depth: number): number {
  return depth * SpiralArmWidth;
  // if (depth === 0) {
  //   return 0;
  // }
  // if (!depth || depth < 0) throw new Error('depth must be a positive integer');
  // const MinDepthDistance = 24;
  // const Y_POS_STEP = 100;
  //
  // let result = 0;
  // for (let i = 0; i < depth; i++) {
  //   result += Math.max(Math.floor(Y_POS_STEP * Math.pow(5 / 10, i)), MinDepthDistance);
  // }
  // return result;
}

export function TidyTree(data: NodeModel) {
  const root = NodeFactory.buildTidyTreeNodes(data);
  addVirtualWallNodes(root);
  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  // first walk
  eachAfter(root, (v: TidyNode) => {
    const children = v.children;
    const siblings = v.parent?.children || [];
    const leftSibling = v.i ? siblings[v.i - 1] : null;
    if (children.length) {
      executeShifts(v);
      const midpoint = (children[0].prelim + children[children.length - 1].prelim) / 2;
      if (leftSibling) {
        v.prelim = leftSibling.prelim + Separation(leftSibling, v);
        v.mod = v.prelim - midpoint;
      } else {
        v.prelim = midpoint;
      }
    } else if (leftSibling) {
      v.prelim = leftSibling.prelim + Separation(leftSibling, v);
    }
    if (v.parent) {
      v.parent!.Ancestor = apportion(v, leftSibling, v.parent!.Ancestor || siblings[0]);
    }
  });

  // Computes all real x-coordinates by summing up the modifiers recursively.
  // second walk
  let left = root;
  let right = root;
  let bottom = root;

  eachBefore(root, (v: TidyNode) => {
    if (v.parent && v.isVirtual) {
      v.parent.children = []; // remove virtual wall nodes
      return;
    }
    const parentMod = v.parent?.mod || 0;
    v.x = v.prelim + parentMod;
    v.mod += parentMod;
    v.y = YPosition(v.depth);

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.x < left.x) left = v;
    if (v.x > right.x) right = v;
    if (v.depth > bottom.depth) bottom = v;
  });

  // calculate final positions
  eachAfter(root, (v: TidyNode) => {
    v.ref.x = v.x;
    v.ref.y = v.y;
    v.children.forEach(child => {
      if (child.ref.range[0].x < v.ref.range[0].x) v.ref.range[0] = child.ref.range[0];
      if (child.ref.range[1].x > v.ref.range[1].x) v.ref.range[1] = child.ref.range[1];
    });
    if (v.children.length === 1) {
      v.ref.x = v.ref.children[0].x;
      v.ref.width = v.ref.children[0].width;
    } else if (v.children.length) {
      v.ref.x = v.ref.range[0].x;
      v.ref.width = v.ref.range[1].x + v.ref.range[1].width - v.ref.range[0].x;
    }
    v.ref.childrenDepth = v.children.reduce((acc, curr) => Math.max(acc, curr.ref.childrenDepth + 1), 0);
  });
  console.log(
    `${root.ref.name} leftmost: ${left.ref.name}, rightmost: ${right.ref.name}, fullWidth: ${right.x - left.x} depth: ${root.ref.childrenDepth}`
  );
}

// adds 'virtual' nodes to leftmost and rightmost leaves of each parent to prevent subtrees from overlapping
function addVirtualWallNodes(root: TidyNode) {
  const leafs: TidyNode[] = [];
  const temp: TidyNode[] = [root];
  let totalDepth = 0;
  // eachAfter
  while (temp.length) {
    const node = temp.pop()!;
    if (!node.children.length) {
      leafs.push(node);
      totalDepth = Math.max(totalDepth, node.depth);
    } else {
      for (let i = 0; i < node.children.length; i++) {
        temp.push(node.children[i]);
      }
    }
  }
  while (leafs.length) {
    const n = leafs.pop()!;
    let tempVirtualNode!: TidyNode;
    // add virtual nodes all the way to the bottom
    for (let i = n.depth + 1; i <= totalDepth; i++) {
      if (!tempVirtualNode) {
        tempVirtualNode = NodeFactory.createTidyNode(n.ref, n, true);
        n.children.push(tempVirtualNode);
        continue;
      }
      const c = NodeFactory.createTidyNode(n.ref, tempVirtualNode, true);
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
function apportion(currentNode: TidyNode, leftSibling: TidyNode | null, defaultAncestor: TidyNode): TidyNode {
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

export function eachAfter<T extends { children: T[] }>(root: T, callback: (node: T) => void): void {
  const nodes: T[] = [root];
  const next: T[] = [];
  let node: T | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.children.length; i++) nodes.push(node.children[i]);
  }
  while (next.length) callback(next.pop()!);
}

function eachBefore<T extends { children: T[] }>(root: T, callback: (node: T) => void): void {
  const nodes: T[] = [root];
  let node: T | undefined;

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
function nextLeft(v: TidyNode): TidyNode | null {
  const children = v.children;
  return children.length ? children[0] : v.thread;
}

// This function works analogously to nextLeft.
function nextRight(v: TidyNode): TidyNode | null {
  const children = v.children;
  return children.length ? children[children.length - 1] : v.thread;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: TidyNode, wp: TidyNode, shift: number): void {
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
function executeShifts(v: TidyNode): void {
  let shift = 0;
  let change = 0;
  const children = v.children;
  if (!children.length) return;

  let i = children.length;
  let w: TidyNode;
  while (--i >= 0) {
    w = children[i];
    w.prelim += shift;
    w.mod += shift;
    shift += w.shift + (change += w.change);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: TidyNode, v: TidyNode, ancestor: TidyNode): TidyNode {
  return vim.ancestor.parent === v.parent ? vim.ancestor : ancestor;
}
