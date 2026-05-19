import { HierarchyCircularNode } from 'd3';
import { GraphNodeBase, GraphNodeEnum } from '../../models';

export function d3pack() {
  const MIN_PADDING = 15;
  const MIN_RADIUS = 20;
  const padding = (n: HierarchyCircularNode<GraphNodeBase>) => {
    return Math.max(Math.round(Math.sqrt(n.value || 1) * 2), MIN_PADDING);
  };
  const radiusLeaf = (n: HierarchyCircularNode<GraphNodeBase>) => {
    if (!n.children) {
      n.r = Math.round(n.data.area / 2) + MIN_RADIUS;
    }
  }
  const zeroPadding = () => 0;
  const random = lcg();

  function pack(root: HierarchyCircularNode<GraphNodeBase>) {
    root.x = 0.5;
    root.y = 0.5;

    root
      .eachBefore(radiusLeaf)
      .eachAfter(packChildrenRandom(zeroPadding, random))
      .eachAfter(packChildrenRandom(padding, random))
      .eachBefore(translateChild);

    return root;
  }

  return pack;
}

function translateChild(node: HierarchyCircularNode<GraphNodeBase>) {
  const parent = node.parent;
  if (parent) {
    node.x = parent.x + node.x;
    node.y = parent.y + node.y;
  }
}

function packChildrenRandom(padding: (n: HierarchyCircularNode<GraphNodeBase>) => number, random: () => number) {
  return function (node: HierarchyCircularNode<GraphNodeBase>) {
    if (node.children?.length) {
      const children = node.children;
      const p = padding(node);

      // todo comment out for loops to get parent padding only. For loops are inner (children) padding
      if (p) for (let i = 0; i < children.length; ++i) children[i].r += p;
      const e = packSiblingsRandom(children, random);
      if (p) for (let i = 0; i < children.length; ++i) children[i].r -= p;
      node.r = e + p;
    }
  };
}

function lcg() {
  const a = 1664525;
  const c = 1013904223;
  const m = 4294967296; // 2^32
  let s = 1;
  return () => (s = (a * s + c) % m) / m;
}

/**
 * siblings.js
 */
function place(b, a, c) {
  let dx = b.x - a.x,
    x,
    a2,
    dy = b.y - a.y,
    y,
    b2,
    d2 = dx * dx + dy * dy;
  if (d2) {
    ((a2 = a.r + c.r), (a2 *= a2));
    ((b2 = b.r + c.r), (b2 *= b2));
    if (a2 > b2) {
      x = (d2 + b2 - a2) / (2 * d2);
      y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
      c.x = b.x - x * dx - y * dy;
      c.y = b.y - x * dy + y * dx;
    } else {
      x = (d2 + a2 - b2) / (2 * d2);
      y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
      c.x = a.x + x * dx - y * dy;
      c.y = a.y + x * dy + y * dx;
    }
  } else {
    c.x = a.x + c.r;
    c.y = a.y;
  }
}

function intersects(a, b) {
  const dr = a.r + b.r - 1e-6,
    dx = b.x - a.x,
    dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function score(node) {
  const a = node._,
    b = node.next._,
    ab = a.r + b.r,
    dx = (a.x * b.r + b.x * a.r) / ab,
    dy = (a.y * b.r + b.y * a.r) / ab;
  return dx * dx + dy * dy;
}

function Node(circle) {
  this._ = circle;
  this.next = null;
  this.previous = null;
}

export function packSiblingsRandom(circles: HierarchyCircularNode<GraphNodeBase>[], random) {
  if (!(n = (circles = array(circles)).length)) return 0;

  var a, b, c, n, aa, ca, i, j, k, sj, sk;

  // Place the first circle.
  ((a = circles[0]), (a.x = 0), (a.y = 0));
  if (!(n > 1)) return a.r;

  // Place the second circle.
  ((b = circles[1]), (a.x = -b.r), (b.x = a.r), (b.y = 0));
  if (!(n > 2)) return a.r + b.r;

  // Place the third circle.
  place(b, a, (c = circles[2]));

  // Initialize the front-chain using the first three circles a, b and c.
  ((a = new Node(a)), (b = new Node(b)), (c = new Node(c)));
  a.next = c.previous = b;
  b.next = a.previous = c;
  c.next = b.previous = a;

  // Attempt to place each remaining circle…
  pack: for (i = 3; i < n; ++i) {
    (place(a._, b._, (c = circles[i])), (c = new Node(c)));

    // Find the closest intersecting circle on the front-chain, if any.
    // “Closeness” is determined by linear distance along the front-chain.
    // “Ahead” or “behind” is likewise determined by linear distance.
    ((j = b.next), (k = a.previous), (sj = b._.r), (sk = a._.r));
    do {
      if (sj <= sk) {
        if (intersects(j._, c._)) {
          ((b = j), (a.next = b), (b.previous = a), --i);
          continue pack;
        }
        ((sj += j._.r), (j = j.next));
      } else {
        if (intersects(k._, c._)) {
          ((a = k), (a.next = b), (b.previous = a), --i);
          continue pack;
        }
        ((sk += k._.r), (k = k.previous));
      }
    } while (j !== k.next);

    // Success! Insert the new circle c between a and b.
    ((c.previous = a), (c.next = b), (a.next = b.previous = b = c));

    // Compute the new closest circle pair to the centroid.
    aa = score(a);
    while ((c = c.next) !== b) {
      if ((ca = score(c)) < aa) {
        ((a = c), (aa = ca));
      }
    }
    b = a.next;
  }

  // Compute the enclosing circle of the front chain.
  ((a = [b._]), (c = b));
  while ((c = c.next) !== b) a.push(c._);
  c = packEncloseRandom(a, random);

  // Translate the circles to put the enclosing circle around the origin.
  for (i = 0; i < n; ++i) ((a = circles[i]), (a.x -= c.x), (a.y -= c.y));

  return c.r;
}

/**
 * enclose.js
 */
export function packEncloseRandom(circles, random) {
  let i = 0,
    n = (circles = shuffle(Array.from(circles), random)).length,
    B = [],
    p,
    e;

  while (i < n) {
    p = circles[i];
    if (e && enclosesWeak(e, p)) ++i;
    else ((e = encloseBasis((B = extendBasis(B, p)))), (i = 0));
  }

  return e;
}

function extendBasis(B, p) {
  let i, j;

  if (enclosesWeakAll(p, B)) return [p];

  // If we get here then B must have at least one element.
  for (i = 0; i < B.length; ++i) {
    if (enclosesNot(p, B[i]) && enclosesWeakAll(encloseBasis2(B[i], p), B)) {
      return [B[i], p];
    }
  }

  // If we get here then B must have at least two elements.
  for (i = 0; i < B.length - 1; ++i) {
    for (j = i + 1; j < B.length; ++j) {
      if (
        enclosesNot(encloseBasis2(B[i], B[j]), p) &&
        enclosesNot(encloseBasis2(B[i], p), B[j]) &&
        enclosesNot(encloseBasis2(B[j], p), B[i]) &&
        enclosesWeakAll(encloseBasis3(B[i], B[j], p), B)
      ) {
        return [B[i], B[j], p];
      }
    }
  }

  // If we get here then something is very wrong.
  throw new Error();
}

function enclosesNot(a, b) {
  const dr = a.r - b.r,
    dx = b.x - a.x,
    dy = b.y - a.y;
  return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function enclosesWeak(a, b) {
  const dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9,
    dx = b.x - a.x,
    dy = b.y - a.y;
  return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function enclosesWeakAll(a, B) {
  for (let i = 0; i < B.length; ++i) {
    if (!enclosesWeak(a, B[i])) {
      return false;
    }
  }
  return true;
}

function encloseBasis(B) {
  switch (B.length) {
    case 1:
      return encloseBasis1(B[0]);
    case 2:
      return encloseBasis2(B[0], B[1]);
    case 3:
      return encloseBasis3(B[0], B[1], B[2]);
  }
}

function encloseBasis1(a) {
  return {
    x: a.x,
    y: a.y,
    r: a.r
  };
}

function encloseBasis2(a, b) {
  const x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x21 = x2 - x1,
    y21 = y2 - y1,
    r21 = r2 - r1,
    l = Math.sqrt(x21 * x21 + y21 * y21);
  return {
    x: (x1 + x2 + (x21 / l) * r21) / 2,
    y: (y1 + y2 + (y21 / l) * r21) / 2,
    r: (l + r1 + r2) / 2
  };
}

function encloseBasis3(a, b, c) {
  const x1 = a.x,
    y1 = a.y,
    r1 = a.r,
    x2 = b.x,
    y2 = b.y,
    r2 = b.r,
    x3 = c.x,
    y3 = c.y,
    r3 = c.r,
    a2 = x1 - x2,
    a3 = x1 - x3,
    b2 = y1 - y2,
    b3 = y1 - y3,
    c2 = r2 - r1,
    c3 = r3 - r1,
    d1 = x1 * x1 + y1 * y1 - r1 * r1,
    d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2,
    d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3,
    ab = a3 * b2 - a2 * b3,
    xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1,
    xb = (b3 * c2 - b2 * c3) / ab,
    ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1,
    yb = (a2 * c3 - a3 * c2) / ab,
    A = xb * xb + yb * yb - 1,
    B = 2 * (r1 + xa * xb + ya * yb),
    C = xa * xa + ya * ya - r1 * r1,
    r = -(Math.abs(A) > 1e-6 ? (B + Math.sqrt(B * B - 4 * A * C)) / (2 * A) : C / B);
  return {
    x: x1 + xa + xb * r,
    y: y1 + ya + yb * r,
    r: r
  };
}

/**
 * array.js
 */
function array(x) {
  return typeof x === 'object' && 'length' in x
    ? x // Array, TypedArray, NodeList, array-like
    : Array.from(x); // Map, Set, iterable, string, or anything else
}

function shuffle(array, random) {
  let m = array.length,
    t,
    i;

  while (m) {
    i = (random() * m--) | 0;
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }

  return array;
}
