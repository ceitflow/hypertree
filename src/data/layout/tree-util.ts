export interface NodeData {
  children?: NodeData[];
  x?: number;
  y?: number;
  layoutX: number;
  layoutY: number;
  depth: number;
  [key: string]: any;
}

export interface LinkData {
  source: NodeData;
  target: NodeData;
}

// This function is used to traverse the left contour of a subtree (or
// subforest). It returns the successor of v on this contour. This successor is
// either given by the leftmost child of v or by the thread of v. The function
// returns null if and only if v is on the highest level of its subtree.

export function nextLeft(v: TreeNode): TreeNode | null {
  const children = v.children;
  return children ? children[0] : v.t;
}

// This function works analogously to nextLeft.
export function nextRight(v: TreeNode): TreeNode | null {
  const children = v.children;
  return children ? children[children.length - 1] : v.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
export function moveSubtree(wm: TreeNode, wp: TreeNode, shift: number): void {
  const change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
export function executeShifts(v: TreeNode): void {
  let shift = 0;
  let change = 0;
  const children = v.children;
  if (!children) return;

  let i = children.length;
  let w: TreeNode;
  while (--i >= 0) {
    w = children[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
export function nextAncestor(vim: TreeNode, v: TreeNode, ancestor: TreeNode): TreeNode {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}

export class TreeNode {
  _: NodeData;
  parent: TreeNode | null;
  children: TreeNode[] | null;
  A: TreeNode | null; // default ancestor
  a: TreeNode; // ancestor
  z: number; // prelim
  m: number; // mod
  c: number; // change
  s: number; // shift
  t: TreeNode | null; // thread
  i: number; // number

  constructor(node: NodeData, i: number) {
    this._ = node;
    this.parent = null;
    this.children = null;
    this.A = null;
    this.a = this;
    this.z = 0;
    this.m = 0;
    this.c = 0;
    this.s = 0;
    this.t = null;
    this.i = i;
  }

  eachAfter(callback: (node: TreeNode) => void): void {
    const nodes: TreeNode[] = [this];
    const next: TreeNode[] = [];
    let node: TreeNode | undefined;

    while (node = nodes.pop()) {
      next.push(node);
      if (node.children) {
        for (let i = 0; i < node.children.length; i++) {
          nodes.push(node.children[i]);
        }
      }
    }

    while (node = next.pop()) {
      callback(node);
    }
  }

  eachBefore(callback: (node: TreeNode) => void): void {
    const nodes: TreeNode[] = [this];
    let node: TreeNode | undefined;

    while (node = nodes.pop()) {
      callback(node);
      if (node.children) {
        for (let i = node.children.length - 1; i >= 0; i--) {
          nodes.push(node.children[i]);
        }
      }
    }
  }
}

export function treeRoot(root: NodeData): TreeNode {
  const tree = new TreeNode(root, 0);
  const nodes: TreeNode[] = [tree];
  let node: TreeNode | undefined;
  let child: TreeNode;
  let children: NodeData[];
  let i: number;
  let n: number;

  while (node = nodes.pop()) {
    if (children = node._.children!) {
      node.children = new Array(n = children.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children[i], i));
        child.parent = node;
      }
    }
  }

  (tree.parent = new TreeNode(null as any, 0)).children = [tree];
  return tree;
}
