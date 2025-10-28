import { Radius } from './tidy-tree.ts';
import { RadialModel } from '../types.ts';
import { EjectNodeDiameter } from './layout-factory.ts';

export function RadialsLayout(root: RadialModel) {
  const list: RadialModel[] = [root];
  const stack: RadialModel[] = [];
  let node: RadialModel | undefined;
  while (list.length) {
    node = list.pop()!;
    stack.push(node);
    node.ejectedRadials.forEach(e => list.push(e));
  }

  // eachAfter for radials
  while (stack.length) {
    const radial = stack.pop()!;
    const children: RadialModel[] = [];
    let radiiSum = 0;
    let largestChildRadius = 0;

    radial.ejectedRadials.forEach(eject => {
      children.push(eject);
      radiiSum += eject.radius;
      largestChildRadius = Math.max(largestChildRadius, eject.radius);
    });

    if (!children.length) {
      continue;
    }
    // sort to assign correct angles in order
    children.sort((a, b) => a.parentNode!.angle - b.parentNode!.angle);

    let tempLastAngle = 0;
    console.log('\n ' + radial.rootId, 'totalRadiiSum:', radiiSum, 'est radius:', radiiSum / 2 / Math.PI);
    children.forEach(eject => {
      const angularRange = (eject.radius / radiiSum) * 2 * Math.PI;
      const a = tempLastAngle + angularRange / 2 - Math.PI / 2; // middle of angular range
      const radius = largestChildRadius * 4 + radial.selfRadius;
      const polarX = radius * Math.cos(a); // TODO this is the edge of eject, not the center (offset by eject.radius/2 ??)
      const polarY = radius * Math.sin(a);
      eject.x = polarX;
      eject.y = polarY;
      tempLastAngle += angularRange;
      console.log(eject.parentNode!.name, 'angle:', (angularRange * 180) / Math.PI, 'radius:', eject.radius);
    });
    radial.radius += largestChildRadius * 2;
  }
}
