import { DirModel } from '../types.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.
// Create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
export function layout(root: DirModel): void {
  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  // first walk
  eachAfter(root, (v: DirModel) => {
    const children = v.dirs;
    const siblings = v.parent!.dirs;
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
  const depthRadiusMap: {
    [depth: number]: {
      nodes: DirModel[];
      minx: number;
      maxx: number;
      minRadius: number;
      radius: number;
    };
  } = {};
  eachBefore(root, (v: DirModel) => {
    v.layout.x = v.layout.z + v.parent!.layout.m;
    v.layout.m += v.parent!.layout.m;

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.layout.x < left.layout.x) left = v;
    if (v.layout.x > right.layout.x) right = v;
    if (v.layout.depth > bottom.layout.depth) bottom = v;
    // compute radii
    if (!depthRadiusMap[v.layout.depth])
      depthRadiusMap[v.layout.depth] = {
        nodes: [v],
        minx: v.layout.x,
        maxx: v.layout.x,
        minRadius: 0,
        radius: 0,
      };
    else {
      const i = depthRadiusMap[v.layout.depth];
      i.nodes.push(v);
      if (v.layout.x < i.minx) i.minx = v.layout.x;
      if (v.layout.x > i.maxx) i.maxx = v.layout.x;
      i.radius = i.minRadius = (i.maxx - i.minx) / Math.PI / 2;
    }
  });

  console.log(depthRadiusMap, structuredClone(root));

  // calculateRadiuses
  const levels = Object.keys(depthRadiusMap);
  const minOffset = 160;
  // const minSeparationBetweenDiffParentDirs = ; // can be larger that this if radius needs to be bigger

  for (let i = 1; i < levels.length; i++) {
    const depth = parseInt(levels[i]);
    const prevEntry = depthRadiusMap[depth - 1];
    const entry = depthRadiusMap[depth];

    // const sorted = entry.nodes.sort((a, b) => a.layout.x - b.layout.x);
    // let minDistance = Infinity;
    // for (let i = 0; i < sorted.length - 1; i++) {
    //   const distance = sorted[i + 1].layout.x - sorted[i].layout.x;
    //   if (distance < minDistance) minDistance = distance;
    // }

    // const newRatio = sorted.length === 1 ? 1 : 12 / minDistance;
    // sorted.forEach(s => {
    //   s.layout.x = (s.layout.x - center) * newRatio + center;
    // });
    // entry.minx = Math.min(sorted[0].layout.x, prevEntry.nodes[0].layout.x);
    // entry.maxx = Math.max(sorted[sorted.length - 1].layout.x, prevEntry.nodes[prevEntry.nodes.length - 1].layout.x);
    // entry.radius = (entry.maxx - entry.minx) / Math.PI / 2; //* newRatio;

    if (entry.minRadius < prevEntry.minRadius) entry.minRadius = prevEntry.minRadius;
    const prevRadius = prevEntry.radius;
    // // every depth level have the same width initially (max width of initial tree)
    // // TODO need to adjust distances between nodes proportionally, otherwise the separation will be off
    // // distribute 2 PI * minOffset in distances between nodes (x axis)
    if (entry.radius < prevRadius + minOffset) {
      entry.radius = prevRadius + minOffset;
      const ratio = entry.radius / entry.minRadius; // >1
      console.log(`compressing ${depth} by ${1/ratio}`);
      entry.nodes.forEach(s => {
        const center = s.parent!.layout.x; // todo do from end because parents are modified
        s.layout.angleAdjustment = ((s.layout.x - center) / ratio + center - s.layout.x) + s.parent!.layout.angleAdjustment;
        // eachBefore(s.dirs, child => child.layout.angleAdjustment -= s.layout.angleAdjustment );
      });
    }
    // if (i === 1) entry.radius = 300;
  }

  const fullCircle = 2 * Math.PI;
  const tx = -left.layout.x;
  const kx = fullCircle / (right.layout.x - left.layout.x);

  eachBefore(root, (node: DirModel) => {
    // const { minx, maxx } = depthRadiusMap[node.layout.depth];
    const angleRadians = (node.layout.x = (node.layout.x + node.layout.angleAdjustment + tx) * kx); // originally tree is vertical top to bottom
    const radius = (node.layout.y = depthRadiusMap[node.layout.depth].radius);
    node.layout.layoutX = radius * Math.cos(angleRadians - Math.PI / 2);
    node.layout.layoutY = radius * Math.sin(angleRadians - Math.PI / 2);
    // node.layout.layoutX = node.layout.x;
    // node.layout.layoutY = node.layout.y;
  });
}

function separation(a: DirModel, b: DirModel) {
  return a.parent == b.parent ? 12 : 12;
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
function apportion(v: DirModel, w: DirModel | null, ancestor: DirModel): DirModel {
  if (w) {
    let vip = v;
    let vop = v;
    let vim = w;
    let vom = vip.parent!.dirs[0];
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

function eachAfter(root: DirModel, callback: (node: DirModel) => void): void {
  const nodes: DirModel[] = [root];
  const next: DirModel[] = [];
  let node: DirModel | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    next.push(node);
    for (let i = 0; i < node.dirs.length; i++) nodes.push(node.dirs[i]);
  }
  while (next.length) callback(next.pop()!);
}

function eachBefore(root: DirModel | DirModel[], callback: (node: DirModel) => void): void {
  const nodes: DirModel[] = Array.isArray(root) ? [...root] : [root];
  let node: DirModel | undefined;

  while (nodes.length) {
    node = nodes.pop()!;
    callback(node);
    for (let i = node.dirs.length - 1; i >= 0; i--) nodes.push(node.dirs[i]);
  }
}

/* This function is used to traverse the left contour of a subtree (or
   subforest). It returns the successor of v on this contour. This successor is
   either given by the leftmost child of v or by the thread of v. The function
   returns null if and only if v is on the highest level of its subtree. */

function nextLeft(v: DirModel): DirModel | null {
  const children = v.dirs;
  return children.length ? children[0] : v.layout.t;
}

// This function works analogously to nextLeft.
function nextRight(v: DirModel): DirModel | null {
  const children = v.dirs;
  return children.length ? children[children.length - 1] : v.layout.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm: DirModel, wp: DirModel, shift: number): void {
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
export function executeShifts(v: DirModel): void {
  let shift = 0;
  let change = 0;
  const children = v.dirs;
  if (!children.length) return;

  let i = children.length;
  let w: DirModel;
  while (--i >= 0) {
    w = children[i];
    w.layout.z += shift;
    w.layout.m += shift;
    shift += w.layout.s + (change += w.layout.c);
  }
}

// If vi-'s ancestor is a sibling of v, returns vi-'s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim: DirModel, v: DirModel, ancestor: DirModel): DirModel {
  return vim.layout.a.parent === v.parent ? vim.layout.a : ancestor;
}
