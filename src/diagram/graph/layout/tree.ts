import { DirModel } from '../types.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.
// Create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
export function tidyLayout(root: DirModel): void {
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
      radius: number;
      compressionRatio: number;
    };
  } = {};

  const getMaxX = (n: DirModel): number => n.layout.x + (n.files.length ? n.files.length * 12 + 12 : 0);

  eachBefore(root, (v: DirModel) => {
    v.layout.x = v.layout.z + v.parent!.layout.m;
    v.layout.angle = v.layout.x;
    v.layout.m += v.parent!.layout.m;

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.layout.x < left.layout.x) left = v;
    if (getMaxX(v) > getMaxX(right)) right = v;
    if (v.layout.depth > bottom.layout.depth) bottom = v;
    // compute radii
    if (!depthRadiusMap[v.layout.depth])
      depthRadiusMap[v.layout.depth] = {
        nodes: [],
        radius: 0,
        compressionRatio: 1,
      };
    const i = depthRadiusMap[v.layout.depth];
    i.nodes.push(v);
  });

  console.log(depthRadiusMap, structuredClone(root));

  const sep = left === right ? 1 : separation(left, right) / 2; // extra separation to prevent overlaps on same levels (start and end nodes)
  const fullWidth = getMaxX(right) - left.layout.x + sep;
  console.log(`leftmost: ${left.name}, rightmost: ${right.name}, fullWidth: ${fullWidth}`);

  // calculateRadiuses
  const levels = Object.keys(depthRadiusMap);
  const minOffset = 140;
  // const minSeparationBetweenDiffParentDirs = ; // can be larger that this if radius needs to be bigger

  // each next level inherit previous radius
  for (let i = 1; i < levels.length; i++) {
    const depth = parseInt(levels[i]);
    const entry = depthRadiusMap[depth];
    let radius = fullWidth + minOffset * (i - 1) * Math.PI * 2;
    // if (depth === 1) radius = 300 * Math.PI * 2; // todo compression without angleAdjustment
    // else if (depth === 2) radius = 440 * Math.PI * 2;
    // else if (depth === 3) radius = 1700 * Math.PI * 2;
    entry.nodes.sort((a, b) => a.layout.x - b.layout.x);
    entry.radius = radius / Math.PI / 2;
    entry.compressionRatio = fullWidth / radius; // < 1
    console.log(`compressing level:${depth} by ${entry.compressionRatio}`);
    entry.nodes.forEach(dir => {
      // compressing nodes in the level
      // const center = dir.parent!.layout.x;
      // dir.layout.angleAdjustment = (dir.layout.x - center) * entry.compressionRatio + center - dir.layout.x + dir.parent!.layout.angleAdjustment;
    });
  }

  const fullCircle = 2 * Math.PI;
  const tx = sep - left.layout.x;
  const kx = fullCircle / fullWidth;

  eachBefore(root, ({ layout, files, parent, name }: DirModel) => {
    const entry = depthRadiusMap[layout.depth];
    layout.angle = (layout.x + layout.angleAdjustment + tx) * kx; // radians
    layout.y = entry.radius;
    files.forEach((file, idx) => {
      const fileX = layout.x + 12 * (idx + 1);
      if (entry.compressionRatio !== 1) {
        // adjust files always if level was compressed
        const center = layout.x;
        file.layout.angleAdjustment = (fileX - center) * entry.compressionRatio + center - fileX + parent!.layout.angleAdjustment;
      }
      file.layout.angle = (fileX + file.layout.angleAdjustment + tx) * kx;
      const fRadius = layout.y;
      file.layout.radialX = fRadius * Math.cos(file.layout.angle - Math.PI / 2) || fileX;
      file.layout.radialY = fRadius * Math.sin(file.layout.angle - Math.PI / 2);
      // file.layout.radialX = fileX;
      // file.layout.radialY = fRadius;
    });

    layout.radialX = layout.y * Math.cos(layout.angle - Math.PI / 2);
    layout.radialY = layout.y * Math.sin(layout.angle - Math.PI / 2);
    // layout.radialX = layout.x;
    // layout.radialY = layout.y;
  });
}

function separation(a: DirModel, b: DirModel) {
  if (b.name === 'point-editor') console.log(a.name, a.parent!.layout.i, b.name, b.parent!.layout.i)
  const nodeRadius = 6;
  const childrenWidth = (isABeforeB(a, b) ? a.files.length : b.files.length) * nodeRadius * 2;
  return nodeRadius * 2 + childrenWidth;
}

function isABeforeB(a: DirModel, b: DirModel): boolean {
  // finds common parent and compares index where nodes are
  if (a === b) return false;

  let tempA: DirModel | null = a;
  let tempB: DirModel | null = b;

  // Bring both nodes to the same depth level
  while (tempA.layout.depth > tempB.layout.depth) {
    tempA = tempA.parent!;
  }
  while (tempB.layout.depth > tempA.layout.depth) {
    tempB = tempB.parent!;
  }

  // Now both nodes are at the same depth, traverse up until they meet
  while (tempA && tempB && tempA !== tempB) {
    if (tempA.parent && tempB.parent && tempA.parent === tempB.parent) {
      return tempA.layout.i < tempB.layout.i;
    }
    tempA = tempA.parent;
    tempB = tempB.parent;
  }
  return false;
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
