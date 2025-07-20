import { NodeModel } from '../types.ts';

// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
// Create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
export function layout(root: NodeModel): void {
  const separation = (a: NodeModel, b: NodeModel) => 12//(a.parent == b.parent ? 0 : 0)

  // Compute the layout using Buchheim et al.'s algorithm.
  eachAfter(root, firstWalk);
  root.parent!.layout.m = -root.layout.z;
  eachBefore(root, secondWalk);

  // If a fixed tree size is specified, scale x and y based on the extent.
  // Compute the left-most, right-most, and depth-most nodes for extents.
  let left = root;
  let right = root;
  let bottom = root;
  const depthRadiusMap: { [depth: number]: { nodesCount: number; radius: number } } = {};
  eachBefore(root, (node: NodeModel) => {
    if (node.layout.x! < left.layout.x!) left = node;
    if (node.layout.x! > right.layout.x!) right = node;
    if (node.layout.depth > bottom.layout.depth) bottom = node;
    if (!depthRadiusMap[node.layout.depth]) depthRadiusMap[node.layout.depth] = { nodesCount: 1, radius: 0 };
    else depthRadiusMap[node.layout.depth].nodesCount++;
  });

  // dynamic radius calculation
  let biggestRadius = 0;
  const nodeRadius = 6;
  for (let i = 0; i < Object.keys(depthRadiusMap).length; i++) {
    const entry = depthRadiusMap[i];
    if (entry.nodesCount === 0) continue;
    if (entry.nodesCount === 1) entry.radius = 6;
    else if (entry.nodesCount === 2) entry.radius = 12;
    else entry.radius = nodeRadius / Math.sin(Math.PI / entry.nodesCount);

    if (i >= 1) {
      const prevRadius = depthRadiusMap[i - 1].radius;
      if (entry.radius <= prevRadius + 100) entry.radius = prevRadius + 100;
    }
    if (entry.radius > biggestRadius) biggestRadius = entry.radius;
    // if (i >= 2) {
      // const prevPrevRadius = depthRadiusMap[i - 2].radius;
      // const prevRadius = depthRadiusMap[i - 1].radius;
      // const halfPointRadius = (entry.radius - prevPrevRadius) / 2 + prevPrevRadius;
      // if (prevRadius < entry.radius - 100) {
        // depthRadiusMap[i -1].radius = entry.radius - 100;
      // }
    // }
  }

  for (let i = 1; i < Object.keys(depthRadiusMap).length; i++) {
    depthRadiusMap[i].radius = biggestRadius + i * 100;
  }

  // translates negative into positive coordinates (for horizontal tree)
  // calculates layout positions
  const fullCircle = 2 * Math.PI;
  const sep = left === right ? 1 : separation(left, right) / 2;
  const tx = sep - left.layout.x!;
  const kx = fullCircle / (right.layout.x! + sep + tx);
  eachBefore(root, (node: NodeModel) => {
    const angleRadians = (node.layout.x = (node.layout.x! + tx) * kx); // originally tree is horizontal from left to right
    const radius = (node.layout.y = depthRadiusMap[node.layout.depth].radius);
    node.layout.layoutX = radius * Math.cos(angleRadians - Math.PI / 2);
    node.layout.layoutY = radius * Math.sin(angleRadians - Math.PI / 2);
  });

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  function firstWalk(v: NodeModel): void {
    if (!v.parent) return;
    const children = v.children;
    const siblings = v.parent.children;
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
  }

  // Computes all real x-coordinates by summing up the modifiers recursively.
  function secondWalk(v: NodeModel): void {
    if (!v.parent) return;
    v.layout.x = v.layout.z + v.parent!.layout.m;
    v.layout.m += v.parent!.layout.m;
  }

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
  function apportion(v: NodeModel, w: NodeModel | null, ancestor: NodeModel): NodeModel {
    if (w) {
      let vip = v;
      let vop = v;
      let vim = w;
      let vom = vip.parent!.children![0];
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

function eachBefore(root: NodeModel, callback: (node: NodeModel) => void): void {
  const nodes: NodeModel[] = [root];
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
  return children.length ? children[0] : v.layout.t;
}

// This function works analogously to nextLeft.
function nextRight(v: NodeModel): NodeModel | null {
  const children = v.children;
  return children.length ? children[children.length - 1] : v.layout.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: NodeModel, wp: NodeModel, shift: number): void {
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
export function executeShifts(v: NodeModel): void {
  let shift = 0;
  let change = 0;
  const children = v.children;
  if (!children.length) return;

  let i = children.length;
  let w: NodeModel;
  while (--i >= 0) {
    w = children[i];
    w.layout.z += shift;
    w.layout.m += shift;
    shift += w.layout.s + (change += w.layout.c);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: NodeModel, v: NodeModel, ancestor: NodeModel): NodeModel {
  return vim.layout.a.parent === v.parent ? vim.layout.a : ancestor;
}
