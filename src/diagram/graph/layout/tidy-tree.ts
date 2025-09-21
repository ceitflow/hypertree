import { LayoutModel } from '../types.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.
// Create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
export function TidyTree(root: LayoutModel): { left: LayoutModel, right: LayoutModel } {
  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  // first walk
  eachAfter(root, (v: LayoutModel) => {
    const children = v.children;
    const siblings = v.parent!.children;
    const w = v.layout.i ? siblings[v.layout.i - 1] : null;
    if (children.length) {
      executeShifts(v);
      const midpoint = (children[0].layout.z + children[children.length - 1].layout.z) / 2;
      if (w) {
        v.layout.z = w.layout.z + separation(v, w);
        v.layout.m = v.layout.z - midpoint;
      } else {
        v.layout.z = midpoint;
      }
    } else if (w) {
      v.layout.z = w.layout.z + separation(v, w);
    }
    v.parent!.layout.A = apportion(v, w, v.parent!.layout.A || siblings[0]);
  });
  root.parent!.layout.m = -root.layout.z; // edge case for root node to move it upward

  // Computes all real x-coordinates by summing up the modifiers recursively.
  // second walk
  let left = root;
  let right = root;
  let bottom = root;

  eachBefore(root, (v: LayoutModel) => {
    v.layout.x = v.layout.z + v.parent!.layout.m;
    v.layout.angle = v.layout.x;
    v.layout.m += v.parent!.layout.m;
    v.layout.y = v.layout.depth * 400

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.layout.x < left.layout.x) left = v;
    if (v.layout.x > right.layout.x) right = v;
    if (v.layout.depth > bottom.layout.depth) bottom = v;
  });

  return { left, right };
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
function apportion(v: LayoutModel, w: LayoutModel | null, ancestor: LayoutModel): LayoutModel {
  if (w) {
    let vip = v;
    let vop = v;
    let vim = w;
    let vom = vip.parent!.children[0];
    let sip = vip.layout.m;
    let sop = vop.layout.m;
    let sim = vim.layout.m;
    let som = vom.layout.m;
    let shift: number;
    while (((vim = nextRight(vim)!), (vip = nextLeft(vip)!), vim && vip)) {
      vom = nextLeft(vom)!;
      vop = nextRight(vop)!;
      vop.layout.a = v;
      shift = vim.layout.z + sim - vip.layout.z - sip + separation(vim, vip);
      if (shift > 0) {
        moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
        sip += shift;
        sop += shift;
      }
      sim += vim.layout.m;
      sip += vip.layout.m;
      som += vom.layout.m;
      sop += vop.layout.m;
    }
    if (vim && !nextRight(vop)) {
      vop.layout.t = vim;
      vop.layout.m += sim - sop;
    }
    if (vip && !nextLeft(vom)) {
      vom.layout.t = vip;
      vom.layout.m += sip - som;
      ancestor = v;
    }
  }
  return ancestor;
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
  return children.length ? children[0] : v.layout.t;
}

// This function works analogously to nextLeft.
function nextRight(v: LayoutModel): LayoutModel | null {
  const children = v.children;
  return children.length ? children[children.length - 1] : v.layout.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: LayoutModel, wp: LayoutModel, shift: number): void {
  const change = shift / (wp.layout.i - wm.layout.i);
  wp.layout.c -= change;
  wp.layout.s += shift;
  wm.layout.c += change;
  wp.layout.z += shift;
  wp.layout.m += shift;
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
    w.layout.z += shift;
    w.layout.m += shift;
    shift += w.layout.s + (change += w.layout.c);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: LayoutModel, v: LayoutModel, ancestor: LayoutModel): LayoutModel {
  return vim.layout.a.parent === v.parent ? vim.layout.a : ancestor;
}
