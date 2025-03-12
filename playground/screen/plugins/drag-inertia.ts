import { Point } from '../types.ts';
import { Transform } from '../transform.ts';

export class DragInertia {
  loop= { id: 0, active: false };
  strengthMultiplier= 0.5;
  minDistanceTrigger= 0;
  minVelocity= 1;
  velocity= [0, 0];

  constructor(private transform: Transform) {
  }

  startAnimation(cachedPointers: Point[]): void {
    const { loop, velocity, strengthMultiplier, minDistanceTrigger, minVelocity } = this;

    // calculate velocity
    velocity[0] = 0;
    velocity[1] = 0;
    for (let i = 1; i < cachedPointers.length; i++) {
      const previous = cachedPointers[i - 1];
      const current = cachedPointers[i];
      const ratio = (i + 1) / cachedPointers.length;
      const weight = ratio * ratio * (ratio === 1 ? 1 : strengthMultiplier);
      velocity[0] += weight * (current[0] - previous[0]);
      velocity[1] += weight * (current[1] - previous[1]);
    }

    if (Math.abs(velocity[0]) + Math.abs(velocity[1]) < minDistanceTrigger) {
      return;
    }

    const animationLoop = (t: number) => {
      if (loop.active) loop.id = requestAnimationFrame(animationLoop);

      const dx = velocity[0];
      const dy = velocity[1];
      this.transform.transform[0] += dx;
      this.transform.transform[1] += dy;
      this.transform.update();
      velocity[0] *= 0.92;
      velocity[1] *= 0.92;

      if (Math.abs(velocity[0]) + Math.abs(velocity[1]) < minVelocity) {
        // end animation
        loop.active = false;
        velocity[0] = 0;
        velocity[1] = 0;
      }
    }
    loop.active = true;
    loop.id = requestAnimationFrame(animationLoop);
  }

  interrupt(): void {
    this.loop.active = false;
  }
}