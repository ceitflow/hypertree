import { State, Vector2 } from '../types';
import { DragInput } from './drag-input';
import { ZoomInput } from './zoom-input';
import { InertiaInput } from './inertia-input';
import { PhysicsInput } from './physics-input';

export type InputController = ReturnType<typeof InputController>;

export function InputController(state: State) {
  const { transform: t, viewport: v } = state;
  const physics = PhysicsInput(state);

  return {
    invert: (x: number, y: number): Vector2 => [(x - t[0] - v[0]) / t[2], (y - t[1] - v[1]) / t[2]],
    physics,
    drag: DragInput(state, physics),
    zoom: ZoomInput(state, physics),
    inertia: InertiaInput(state, physics),
  };
}
