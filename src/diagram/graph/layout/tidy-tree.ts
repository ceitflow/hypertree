import { NodeModel, TidyNode } from '../types.ts';
import { DirPadding, NodeFactory, NodeSize, SpiralArmWidth } from './node-factory.ts';

// Tree diagram using the Reingold-Tilford "tidy" algorithm
// Computes the layout using Buchheim et al.'s algorithm.

function Separation(left: TidyNode, right: TidyNode) {
  return left.width;
}

function YPosition(depth: number): number {
  return depth * SpiralArmWidth;
}

function TidyTree(data: NodeModel) {
  // TODO assign correct width to directories!
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
    v.ref.x = v.prelim + parentMod;
    v.mod += parentMod;
    v.ref.y = YPosition(v.depth);

    // Compute the left-most, right-most, and depth-most nodes for extents.
    if (v.ref.x < left.ref.x) left = v;
    if (v.ref.x > right.ref.x) right = v;
    if (v.depth > bottom.depth) bottom = v;
  });

  // update ranges and widths
  eachAfter(root, (v: TidyNode) => {
    v.children.forEach(child => {
      if (child.ref.range[0].x <= v.ref.range[0].x) v.ref.range[0] = child.ref.range[0];
      if (child.ref.range[1].x >= v.ref.range[1].x) v.ref.range[1] = child.ref.range[1];
      v.ref.childrenDepth = Math.max(v.ref.childrenDepth, child.ref.childrenDepth + 1);
    });
    // moves parent to the left/first child pos
    v.ref.x = v.ref.range[0].x;
  });

  // add padding
  function addPadding(v: TidyNode, globalShift: number) {
    v.ref.x += globalShift;
    let localShift = DirPadding;
    if (!v.children.length) {
      return localShift;
    }
    for (const child of v.children) {
      // if (child.ref.ref.type === 'directory' && child.i > 0) {
      //   localShift += DirPadding;
      //   child.margin = DirPadding; // todo * depth?
      // }
      localShift += addPadding(child, globalShift + localShift); // returns only added padding
    }
    localShift += DirPadding;
    v.padding = DirPadding;

    return localShift;
  }
  addPadding(root, 0);

  // update shape points and dir widths
  eachAfter(root, (v: TidyNode) => {
    if (v.ref.ref.type === 'directory') {
      v.ref.width = v.ref.range[1].x + v.ref.range[1].width - v.ref.range[0].x || v.ref.width;
    }
    // if leaf node
    if (!v.children.length) {
      v.ref.shapePoints.top = [
        [0, 0],
        [v.ref.width, 0]
      ];
      v.ref.shapePoints.bottom = [
        [0, NodeSize],
        [v.ref.width, NodeSize]
      ];
      v.ref.labelPoints = [
        [v.ref.x, v.ref.y + DirPadding, Math.PI / 2]
      ]
      return;
    }

    // if has children then find the min height to fit them
    let height = -Infinity;
    const onlyDirs = v.children[0].ref.ref.type === 'directory';
    if (onlyDirs) {
      // if only directories then look for the shortest one
      v.children.forEach(c => {
        height = Math.max(height, c.ref.shapePoints.bottom[0][1]);
      });
    } else {
      v.children.find(c => {
        const isDir = c.ref.ref.type === 'directory';
        if (!isDir) {
          c.ref.shapePoints.bottom.forEach(point => (height = Math.max(height, point[1])));
        }
        return isDir;
      });
    }

    const lastChild = v.children[v.children.length - 1];
    const lastPoint = lastChild.ref.shapePoints.bottom[lastChild.ref.shapePoints.bottom.length - 1];
    const y = height + (lastChild.ref.y - v.ref.y);
    v.ref.shapePoints.bottom = [
      [0, y],
      [lastPoint[0] + lastChild.ref.x - v.ref.x + v.padding, y],
    ];
    v.ref.shapePoints.top = [
      [0, 0],
      [v.ref.shapePoints.bottom[v.ref.shapePoints.bottom.length - 1][0], 0],
    ];
  });

  console.log(
    `${root.ref.name} leftmost: ${left.ref.name}, rightmost: ${right.ref.name}`,
    `fullWidth: ${right.ref.x - left.ref.x} depth: ${root.ref.childrenDepth}`
  );
}

export default TidyTree;

// adds virtual nodes to leftmost and rightmost leaves of each parent to prevent subtrees from overlapping
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
  if (!leftSibling) {
    return defaultAncestor;
  }
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

export function eachBefore<T extends { children: T[] }>(root: T, callback: (node: T) => void): void {
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
