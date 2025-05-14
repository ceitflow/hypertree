import { State } from '../types';
import { Round } from './input';

export type PhysicsTransformerType = ReturnType<typeof PhysicsTransformer>;

export function PhysicsTransformer({ physics, frameStart, transform: t, physicsTransform: pt, extent }: State) {
  return {
    addForce: (dx: number, dy: number) => {
      const { input, currentInput, animation, stiffness, maxCompressPercent } = physics;
      const { output } = animation;

      const width = (extent[2] - extent[0]) * t[2];
      const height = (extent[3] - extent[1]) * t[2];
      const xStiffness = 1 - currentInput[0] / (width * maxCompressPercent);
      const yStiffness = 1 - currentInput[1] / (height * maxCompressPercent);

      input[0] += dx;
      input[1] += dy;

      output[0] = input[0] - currentInput[0];
      output[1] = input[1] - currentInput[1];
      // output + currInput - max; if <0 then in range, if >0 then its above limit and need a cap
      output[0] -= Math.sign(currentInput[0]) * Math.max(Math.abs(output[0] + currentInput[0]) - width * maxCompressPercent, 0);
      output[1] -= Math.sign(currentInput[1]) * Math.max(Math.abs(output[1] + currentInput[1]) - height * maxCompressPercent, 0);

      animation.active = true;
      animation.timeStart = frameStart.time;
    },

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

      physics.active = true;
    },
  };
}
