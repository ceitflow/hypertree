import { State, Vector2 } from '../types.ts';
import { DragInput, InertiaInput, PhysicsInput, ZoomInput } from './input';

export type InputTransformerType = ReturnType<typeof InputTransformer>;

export function InputTransformer(state: State) {
  const { transform } = state;
  const physics = PhysicsInput(state);

  return {
    invert: (x: number, y: number): Vector2 => [(x - transform[0]) / transform[2], (y - transform[1]) / transform[2]],
    physics,
    drag: DragInput(state, physics),
    zoom: ZoomInput(state, physics),
    inertia: InertiaInput(state, physics),
  };
}
