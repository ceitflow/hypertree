import { RadialModel } from '../types.ts';
import { SEPARATION } from './tidy-tree.ts';

export function RadialsLayout(root: RadialModel) {
  // eachAfter for radials
  const rStack: RadialModel[] = [root];
  const radials: RadialModel[] = [];
  let node: RadialModel | undefined;
  while (rStack.length) {
    node = rStack.pop()!;
    radials.push(node);
    node.ejectedRadials.forEach(e => rStack.push(e));
  }
  while (radials.length) {
    const radial = radials.pop()!;
    let biggestChildDiameter = 0;
    radial.ejectedRadials.forEach(eject => {
      const parent = eject.parentNode;
      if (!parent) return;
      const angle = parent.angle // + parent.angleAdjustment;
      const newLength = radial.radius + eject.radius + SEPARATION; // min distance + padding
      eject.x = newLength * Math.cos(angle);
      eject.y = newLength * Math.sin(angle);
      biggestChildDiameter = Math.max(biggestChildDiameter, eject.radius);
      console.log(eject.rootId, eject.x, eject.y);
    });
    radial.radius += biggestChildDiameter;
    console.log(radial);
  }
}
