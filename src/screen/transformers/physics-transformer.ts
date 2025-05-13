import { State } from '../types.ts';

export function PhysicsTransformer({ physics, transform: t, physicsTransform: pt, extent }: State) {
  return {
    nextFrame: () => {
      // todo animated with easeFn
      if (!physics.input[0] && !physics.input[1]) {
        if (physics.active) console.log(physics.input);
        physics.active = false;
        pt[0] = 0;
        pt[1] = 0;
        pt[2] = 0;
        pt[3] = 0;
        return;
      }
      const { input, scale } = physics;
      // physicsTransform: [dx, dy, scaleX, scaleY]
      // input: [xForce, yForce] <- negative [right, bottom], positive [left, top]

      // todo need mapping and limit max force
      // like percentage 10-100%
      const min = 0.5; // can squash only half the size
      const max = 1.5; // can increase half the size
      const width = (extent[2] - extent[0]) * t[2];
      const height = (extent[3] - extent[1]) * t[2];

      if (input[0] >= 0) {
        // squashing to left side
        // decrease scaleX
        pt[2] = -t[2] * (input[0] / width);
      } else {
        // to right side
        // decrease scaleX
        // and translateX to right
        pt[2] = t[2] * (input[0] / width);
        pt[0] = -input[0];
      }

      if (input[1] >= 0) {
        // squash to top side
        // decrease scaleY
        pt[3] = -t[2] * (input[1] / height); // scale + scaleY;
      } else {
        // to bottom side
        // decrease scaleY
        // and translateY to bottom
        pt[3] = t[2] * (input[1] / height);
        pt[1] = -input[1];
      }

      physics.active = true;
    },
  };
}
