import { RadialModel } from '../types.ts';

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
    // children.sort((a, b) => a.parentNode!.angle - b.parentNode!.angle);

    console.log('\n');
    let tempLastAngle = 0;
    const y = radiiSum * 2 / 2 / Math.PI;
    children.forEach(eject => {
      const angularRange = (eject.radius / radiiSum) * 2 * Math.PI;
      const a = tempLastAngle + angularRange / 2 - Math.PI / 2; // middle of angular range
      const radius = Math.max(y, largestChildRadius + radial.selfRadius);
      const polarX = radius * Math.cos(a);
      const polarY = radius * Math.sin(a);
      eject.x = polarX;
      eject.y = polarY;
      console.log(eject.parentNode!.name, 'angle:', (angularRange * 180) / Math.PI, 'radius:', eject.radius);
      tempLastAngle += angularRange;
    });
    radial.radius += y;//largestChildRadius * 2;
    console.log(radial.rootId, 'radius', radial.radius, 'totalRadiiSum:', radiiSum, 'est radius:', radiiSum * 2 / 2 / Math.PI);
  }
}
