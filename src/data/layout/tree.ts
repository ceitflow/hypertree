import {
  executeShifts,
  LinkData,
  moveSubtree,
  nextAncestor,
  nextLeft,
  nextRight,
  NodeData,
  TreeNode,
  treeRoot,
} from './tree-util.ts';
import { Rectangle } from 'pixi.js';

// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
// Create a radial tree layout. The layout’s first dimension (x) is the angle, while the second (y) is the radius.
export function layout(root: NodeData): { nodes: NodeData[], links: LinkData[] } {
  // todo move into tree.ts, create config there
  const separation = (a: NodeData, b: NodeData) => (a.parent == b.parent ? 6 : 100 / a.depth);

  const dx = 2 * Math.PI;
  // const dy = 8 * 1000; // pixels per row
  const treeroot = treeRoot(root);

  // Compute the layout using Buchheim et al.'s algorithm.
  treeroot.eachAfter(firstWalk);
  treeroot.parent!.m = -treeroot.z;
  treeroot.eachBefore(secondWalk);

  // If a fixed tree size is specified, scale x and y based on the extent.
  // Compute the left-most, right-most, and depth-most nodes for extents.
  let left = root;
  let right = root;
  let bottom = root;
  // todo leftmostNode
  root.eachBefore((node: NodeData) => {
    if (node.x! < left.x!) left = node;
    if (node.x! > right.x!) right = node;
    if (node.depth > bottom.depth) bottom = node;
  });

  const sep = left === right ? 1 : separation(left, right) / 2;
  const tx = sep - left.x!;
  const kx = dx / (right.x! + sep + tx);
  root.eachBefore((node: NodeData) => {
    const angleRadians = node.x = (node.x! + tx) * kx; // originally tree is horizontal from left to right
    const radius = node.y = node.depth * 1000 / 6;
    node.layoutX = radius * Math.cos(angleRadians - Math.PI / 2);
    node.layoutY = radius * Math.sin(angleRadians - Math.PI / 2);
    // todo map<level, itemsCount> to calculate min radius needed
  });

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  function firstWalk(v: TreeNode): void {
    const children = v.children;
    const siblings = v.parent!.children!;
    const w = v.i ? siblings[v.i - 1] : null;
    if (children) {
      executeShifts(v);
      const midpoint = (children[0].z + children[children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent!.A = apportion(v, w, v.parent!.A || siblings[0]);
  }

  // Computes all real x-coordinates by summing up the modifiers recursively.
  function secondWalk(v: TreeNode): void {
    v._.x = v.z + v.parent!.m;
    v.m += v.parent!.m;
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
  function apportion(v: TreeNode, w: TreeNode | null, ancestor: TreeNode): TreeNode {
    if (w) {
      let vip = v;
      let vop = v;
      let vim = w;
      let vom = vip.parent!.children![0];
      let sip = vip.m;
      let sop = vop.m;
      let sim = vim.m;
      let som = vom.m;
      let shift: number;
      while (((vim = nextRight(vim)!), (vip = nextLeft(vip)!), vim && vip)) {
        vom = nextLeft(vom)!;
        vop = nextRight(vop)!;
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }



  return { nodes: root.descendants(), links: root.links() };
}
