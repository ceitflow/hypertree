import { g } from '@joint/core';
import { Ease } from './ease.ts';
import { Clamp, Round } from './limiter.ts';
import { State, Vector2 } from '../../types.ts';
import { PhysicsInputType } from './physics-input.ts';

export function ZoomInput({ transform, zoom, frameStart, viewport, extent }: State, physics: PhysicsInputType) {
  //
  const invertScaleToZoomStep = (targetZoom: number) => {
    // (input[2] - min) / (max - min) = Inverse(fn, extentToViewportScale - min, max - min, 1)
    // input[2]  = Inverse() * (max - min) + min
    const { min, max, inputEaseFn } = zoom;
    return Ease.Inverse(inputEaseFn, targetZoom - min, max - min, 1) * (max - min) + min;
  };

  return {
    // todo adaptive zoom step (like inertia) if zooming while is active then speed up
    zoomStep: (origin: Vector2, step: number) => {
      const { input, min, max, inputEaseFn, animation } = zoom;
      const { output } = animation;
      const currentZoom = transform[2];
      input[0] = origin[0];
      input[1] = origin[1];
      input[2] = Clamp(input[2] + step, min, max); // clamp so there is no dead scrolling if outside range

      const mapping = (input[2] - min) / (max - min); // mapping [min,max] to [0,1] (0,max)
      const diffToTargetZoom = Clamp(min + inputEaseFn(mapping, max - min, 1), min, max) - currentZoom;

      if (!Round(diffToTargetZoom, 4)) return; // todo detect if min,max set min max

      output[0] = -input[0] * diffToTargetZoom;
      output[1] = -input[1] * diffToTargetZoom;
      output[2] = diffToTargetZoom;

      animation.timeStart = frameStart.time;
      animation.active = true;
    },

    zoomToFit: (padding: Vector2 = [0, 0], animated = false, ignoreZoomConstraint = true) => {
      const viewRect = new g.Rect(viewport[0], viewport[1], viewport[2] - viewport[0], viewport[3] - viewport[1]);
      const extentRect = new g.Rect(extent[0], extent[1], extent[2] - extent[0], extent[3] - extent[1]);
      const extentToViewportScale = Math.min(
        (viewRect.width - padding[0] * 2) / extentRect.width,
        (viewRect.height - padding[1] * 2) / extentRect.height
      );

      zoom.input[2] = invertScaleToZoomStep(extentToViewportScale);

      transform[0] = -(extentRect.width * extentToViewportScale - viewRect.width) / 2;
      transform[1] = -(extentRect.height * extentToViewportScale - viewRect.height) / 2;
      transform[2] = extentToViewportScale;
    },

    nextFrame: () => {
      if (!zoom.animation.active) return;

      const { animation, limiter } = zoom;
      const { durationMs, easeFn, output } = animation;
      const { toViewport, forces } = limiter;

      let dx: number;
      let dy: number;
      let ds: number;

      // if instant or empty
      if (durationMs <= frameStart.deltaTime || !(output[0] || output[1] || output[2])) {
        dx = output[0];
        dy = output[1];
        ds = output[2];
        animation.active = false;
      } else {
        // animate next frame
        const time = Math.min(frameStart.time - animation.timeStart, durationMs);
        const prevTime = Math.max(0, time - frameStart.deltaTime);
        dx = easeFn(time, output[0], durationMs) - easeFn(prevTime, output[0], durationMs);
        dy = easeFn(time, output[1], durationMs) - easeFn(prevTime, output[1], durationMs);
        ds = easeFn(time, output[2], durationMs) - easeFn(prevTime, output[2], durationMs);
        if (time === durationMs) {
          animation.active = false;
        }
      }
      if (toViewport) {
        physics.limitToExtent(forces, dx, dy);
      }
      transform[0] += dx + forces[2];
      transform[1] += dy + forces[3];
      transform[2] += ds;
    },
  };
}
