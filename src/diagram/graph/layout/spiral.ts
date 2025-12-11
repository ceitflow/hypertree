import { NodeModel } from '../types.ts';
import { eachBefore } from './tidy-tree.ts';
import { IcicleLayout } from './icicle.ts';
import { DirPadding, NodePadding, NodeSize, SpiralArmWidth } from './node-factory.ts';

export class Spiral {
  spiralLayout(root: NodeModel, overrideLinear = true) {
    console.log(root);
    IcicleLayout(root);
    if (overrideLinear) {
      return;
    }
    this.spiral(root);
  }

  private spiral(root: NodeModel) {
    const startOffset = Math.PI * 600; // todo calculate length of single spiral turn of SpiralArmWidth width

    // calculate arc points for each node
    eachBefore(root, v => {
      const out: [number, number, number] = [0, 0, 0]; // data container (for performance)
      const maxX = v.width;
      const maxY = v.shapePoints.bottom[0][1];

      // v.x loses meaning in polar coordinates, use spiralLength instead
      v.spiralLength = v.x + startOffset; // v.x is distance from 0 set by tidy tree
      v.x = 0;
      v.y = 0;
      v.shapePoints.top = [];
      v.shapePoints.bottom = [];
      v.labelPoints = [];
      let lastLabelX = -300;
      const isDir = v.ref.type === 'directory';
      const d = isDir ? -1 : 0;

      for (let dx = 0; dx <= maxX; dx += NodePadding) {
        // top border
        this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + dx, d, 0, out);
        v.shapePoints.top.push([out[0] - v.x, out[1] - v.y]);

        if (dx - lastLabelX >= 300) {
          const angle = (out[2] + (isDir ? (Math.PI / 2) : 0)) % (2 * Math.PI);
          v.labelPoints.push([out[0], out[1], angle]);
          lastLabelX += 300;
        }
        // bottom border
        this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + dx, d, maxY, out);
        v.shapePoints.bottom.push([out[0] - v.x, out[1] - v.y]);

        if (dx + DirPadding > maxX) {
          // make sure to add the last point
          this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + maxX, d, 0, out);
          v.shapePoints.top.push([out[0] - v.x, out[1] - v.y]);
          this.getCartesianFromSpiralLength(root.childrenDepth, v.spiralLength + maxX, d, maxY, out);
          v.shapePoints.bottom.push([out[0] - v.x, out[1] - v.y]);
        }
      }
    });
    root.x = 0;
    root.y = 0;
  }

  // out: [x, y, angle]
  getCartesianFromSpiralLength(
    totalDepth: number,
    L: number,
    offsetByDepth: number,
    offset: number,
    out: [number, number, number]
  ) {
    const spiralWidth = NodeSize + 40 //totalDepth * SpiralArmWidth;
    const width = spiralWidth / 2 / Math.PI; // distance between spiral arms

    // Step 1: Calculate the angle θ from the arc length L ≈ (a/2) * θ^2  =>  θ = sqrt(2L / a)
    const angle = Math.sqrt((2 * L) / width);

    // Step 2: Calculate the radius r = a * θ with offset
    let radius = width * angle;
    radius = Math.max(0, radius - (totalDepth - offsetByDepth) * SpiralArmWidth + offset);
    out[0] = radius * Math.cos(angle);
    out[1] = radius * Math.sin(angle);
    out[2] = angle;
  }
}
