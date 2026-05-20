import * as d3 from 'd3';
import { d3pack } from './d3pack';
import { eachAfter, eachBefore } from '../../utils';
import { HierarchyCircularNode, SimulationNodeDatum } from 'd3';
import { CodeGraphNode, GraphNodeBase, GraphNodeEnum } from '../../models';

export function clusteredBubblesLayout(root: GraphNodeBase): void {
  const circlePacking = d3pack()(
    d3 // skip declarations from layout
      .hierarchy(root, (d) => (d.type !== GraphNodeEnum.Code && d.children.length ? d.children : null))
      .sum((d) => d.area)
      .sort((a, b) => {
        return a.data.type === GraphNodeEnum.Virtual ? -1 : (b.value ?? 0) - (a.value ?? 0); // file group first
      }) as HierarchyCircularNode<GraphNodeBase>
  );
  circlePacking.each((h) => {
    const node = h.data;
    const r = Math.floor(h.r) || 1;

    node.radius = r;
    node.bbox = {
      x: h.x - r,
      y: h.y - r,
      width: r * 2,
      height: r * 2
    };

    // render declarations in a column
    if (node.type === GraphNodeEnum.Code) {
      const code = node as CodeGraphNode;
      const children = code.children;
      const n = children.length;
      const R = code.radius;
      const pad = 4;

      // Largest axis-aligned square inscribed in circle radius R_eff (side = √2 · R_eff).
      const colW = R * 2;
      const colH = R * 2;
      const colLeft = 0;
      const colTop = 0;

      const gap = pad;
      const vPad = pad;
      const gapsTotal = Math.max(0, n - 1) * gap;
      const innerH = Math.max(1, colH - 2 * vPad - gapsTotal);
      const denom = code.ast.loc > 0 ? code.ast.loc : 1;

      let y = colTop;
      let allocated = 0;
      for (let i = 0; i < n; i++) {
        const child = children[i]!;
        let h: number;
        if (n === 1) {
          h = innerH;
        } else if (i < n - 1) {
          h = Math.max(1, Math.floor((child.ast.loc / denom) * innerH));
          allocated += h;
        } else {
          h = Math.max(1, innerH - allocated);
        }
        child.bbox = {
          x: code.bbox.x + colLeft,
          y: code.bbox.y + y,
          width: colW,
          height: h
        };
        child.radius = Math.min(colW, h) / 2;
        y += h + gap;
      }
    }
  });

  centerVirtualChildrenWithForce(root);

  const rootDx = root.bbox.x < 0 ? root.bbox.x : 0;
  const rootDy = root.bbox.y < 0 ? root.bbox.y : 0;
  eachBefore(root, (n) => {
    n.bbox.x -= rootDx;
    n.bbox.y -= rootDy;
  });
}

const FORCE_TICKS = 200;
const FORCE_COLLIDE_PAD = 4;

function centerVirtualChildrenWithForce(root: GraphNodeBase): void {
  eachAfter(root, (dir) => {
    if (dir.type !== GraphNodeEnum.Directory) return;

    const dirCenter = getNodeCenter(dir);

    const children: ForceLayoutNode[] = dir.children.map((child) => {
      const center = getNodeCenter(child);
      const isVirtual = child.type === GraphNodeEnum.Virtual;
      return {
        node: child,
        x: center.x,
        y: center.y,
        r: child.radius,
        isVirtual,
        fx: isVirtual ? dirCenter.x : null, // d3 pinning position
        fy: isVirtual ? dirCenter.y : null
      };
    });

    const simulation = d3
      .forceSimulation(children)
      .force(
        'collide',
        d3
          .forceCollide<ForceLayoutNode>()
          .radius((d) => d.r + FORCE_COLLIDE_PAD)
          .iterations(3)
          .strength(2)
      )
      .force('charge', d3.forceManyBody<ForceLayoutNode>().strength(-2))
      .force(
        'radial',
        d3
          .forceRadial<ForceLayoutNode>(
            (d) => (d.isVirtual ? 0 : d.r + 4),
            dirCenter.x,
            dirCenter.y
          )
          .strength((d) => (d.isVirtual ? 0 : 0.85))
      )
      .stop();

    for (let i = 0; i < FORCE_TICKS; i++) {
      simulation.tick();
    }

    let minR = 1;
    for (const d of children) {
      const diffX = d.x! - d.r - d.node.bbox.x;
      const diffY = d.y! - d.r - d.node.bbox.y;

      if (d.node.children.length && d.node.type !== GraphNodeEnum.Code) {
        eachBefore(d.node, (n) => {
          n.bbox.x += diffX;
          n.bbox.y += diffY;
        });
      } else {
        d.node.bbox.x += diffX;
        d.node.bbox.y += diffY;
      }

      const c = getNodeCenter(d.node);
      const dst = Math.hypot(c.x - dirCenter.x, c.y - dirCenter.y) + d.r;
      if (dst > minR) minR = dst;
    }

    const rDiff = minR - dir.radius;
    dir.radius = minR;
    dir.bbox.x -= rDiff;
    dir.bbox.y -= rDiff;
    dir.bbox.width = 2 * minR;
    dir.bbox.height = 2 * minR;
  });
}

type ForceLayoutNode = SimulationNodeDatum & {
  node: GraphNodeBase;
  r: number;
  isVirtual: boolean;
};

function getNodeCenter(node: GraphNodeBase): { x: number; y: number } {
  return { x: node.bbox.x + node.radius, y: node.bbox.y + node.radius };
}
