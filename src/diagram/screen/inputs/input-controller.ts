import { State, Vector2 } from '../types.ts';
import { DragInput } from './drag-input.ts';
import { ZoomInput } from './zoom-input.ts';
import { InertiaInput } from './inertia-input.ts';
import { PhysicsInput } from './physics-input.ts';

export type ScreenController = ReturnType<typeof InputController>;

export function InputController(state: State) {
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
