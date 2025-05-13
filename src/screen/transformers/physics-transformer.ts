import { State } from '../types.ts';

export function PhysicsTransformer({ physics }: State) {
  return {
    nextFrame: () => {
      if (!physics.input[0] && !physics.input[1]) {
        physics.active = false;
      }
      //

      physics.active = true;
    },
  };
}
