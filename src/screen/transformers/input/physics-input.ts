import { State, Vector4 } from '../../types';
import { ExtentLimiter, Round } from './limiter.ts';

export type PhysicsInputType = ReturnType<typeof PhysicsInput>;

export function PhysicsInput(state: State) {
  const { physics, frameStart, zoom, transform: t, physicsTransform: pt, extent, viewport, viewportPadding } = state;

  const addForce = (dx: number, dy: number) => {
    const { input, currentInput, animation, stiffness, maxCompressPercent, inputEaseFn } = physics;
    const { output } = animation;

    const max = maxCompressPercent * (1 - Round((t[2] - zoom.min) / (zoom.max - zoom.min))); // range adapted to zoom, zoomin - no squeeze

    const maxWidth = (extent[2] - extent[0]) * t[2] * max;
    const maxHeight = (extent[3] - extent[1]) * t[2] * max;
    const isDxOpposite = dx === 0 || (dx > 0 ? currentInput[0] < 0 : currentInput[0] >= 0);
    const isDyOpposite = dy === 0 || (dy > 0 ? currentInput[1] < 0 : currentInput[1] >= 0);
    const xStiffness = isDxOpposite ? 1 : 1 + inputEaseFn(Math.abs(currentInput[0]) / maxWidth, stiffness, 1);
    const yStiffness = isDyOpposite ? 1 : 1 + inputEaseFn(Math.abs(currentInput[1]) / maxHeight, stiffness, 1);

    input[0] += dx;
    input[1] += dy;
    output[0] = input[0] / xStiffness - currentInput[0];
    output[1] = input[1] / yStiffness - currentInput[1];
    // output + currInput - max; if <0 then in range, if >0 then its above limit and need a cap
    output[0] -= (currentInput[0] >= 0 ? 1 : -1) * Math.max(Math.abs(output[0] + currentInput[0]) - maxWidth, 0);
    output[1] -= (currentInput[1] >= 0 ? 1 : -1) * Math.max(Math.abs(output[1] + currentInput[1]) - maxHeight, 0);

    animation.active = true;
    animation.timeStart = frameStart.time;
  };

  const clearLimiterForces = (forces: Vector4) => {
    addForce(-forces[0], -forces[1]); // clear applied force
    forces[0] = 0;
    forces[1] = 0;
  };

  return {
    limitToExtent: (forces: Vector4, dx: number, dy: number): void => {
      const { xForce, yForce } = ExtentLimiter(dx, dy, t, viewport, viewportPadding, extent);
      forces[0] += xForce;
      forces[1] += yForce;
      forces[2] = xForce;
      forces[3] = yForce;
      if (!xForce && !yForce) clearLimiterForces(forces);
      else addForce(xForce, yForce);
    },

    clearLimiterForces,

    nextFrame: () => {
      const { animation, currentInput } = physics;
      const { easeFn, output, durationMs } = animation;

      if (!animation.active) return;

      let dx: number;
      let dy: number;

      // if instant or empty
      if (durationMs <= frameStart.deltaTime) {
        dx = output[0];
        dy = output[1];
        animation.active = false;
      } else {
        // animate next frame
        const time = Math.min(frameStart.time - animation.timeStart, durationMs);
        const prevTime = Math.max(0, time - frameStart.deltaTime);
        dx = easeFn(time, output[0], durationMs) - easeFn(prevTime, output[0], durationMs);
        dy = easeFn(time, output[1], durationMs) - easeFn(prevTime, output[1], durationMs);
        if (time === durationMs) {
          animation.active = false;
        }
      }

      // physicsTransform: [dx, dy, scaleX, scaleY]
      // input: [xForce, yForce] <- negative [right, bottom], positive [left, top]
      // console.log('input', physics.input, 'currentInput', currentInput, 'output', output, 'dx', dx, 'dy', dy, 'active', animation.active);

      const scale = t[2];
      const width = (extent[2] - extent[0]) * scale;
      const height = (extent[3] - extent[1]) * scale;

      currentInput[0] += dx;
      currentInput[1] += dy;

      if (dx) {
        // scaleX
        if (currentInput[0] >= 0)
          pt[2] -= scale * (dx / width); // squashing to left side
        else {
          pt[2] -= scale * (-dx / width); // to right side
          pt[0] -= dx;
        }
      }

      if (dy) {
        // scaleY
        if (currentInput[1] >= 0)
          pt[3] -= scale * (dy / height); // squash to top side
        else {
          pt[3] -= scale * (-dy / height); // to bottom side
          pt[1] -= dy;
        }
      }

      if (!Round(currentInput[0], 5)) {
        currentInput[0] = 0;
        pt[0] = 0;
        pt[2] = 0;
      }
      if (!Round(currentInput[1], 5)) {
        currentInput[1] = 0;
        pt[1] = 0;
        pt[3] = 0;
      }
      // console.log(pt);
      physics.active = true;
    },
  };
}
