import { State, Vector2 } from '../types.ts';
import { Ease, Clamp, Round } from '../plugins';
import { PhysicsInputType } from './physics-input.ts';

export function ZoomInput({ config, transform, zoom, frameStart, viewport, extent }: State, physics: PhysicsInputType) {
  //
  const invertScaleToZoomStep = (targetZoom: number) => {
    // (input[2] - min) / (max - min) = Inverse(fn, extentToViewportScale - min, max - min, 1)
    // input[2]  = Inverse() * (max - min) + min
    const { min, max, inputEaseFn } = config.zoom;
    return Ease.Inverse(inputEaseFn, targetZoom - min, max - min, 1) * (max - min) + min;
  };

  return {
    clamp: (dScale: number) => {
      return Clamp(dScale, config.zoom.min, config.zoom.max);
    },
    // todo adaptive zoom step (like inertia) if zooming while is active then speed up
    // todo auto scale min max? depends on viewport size and extent?
    zoomStep: (origin: Vector2, step: number) => {
      const { input, output } = zoom;
      const { min, max, inputEaseFn } = config.zoom;
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

      zoom.timeStart = frameStart.time;
      zoom.active = true;
    },

    zoomToFit: (padding: Vector2 = [0, 0], animated = false, ignoreZoomConstraint = true) => {
      const viewRect = { x: viewport[0], y: viewport[1], width: viewport[2] - viewport[0], height: viewport[3] - viewport[1] };
      const extentRect = { x: extent[0], y: extent[1], width: extent[2] - extent[0], height: extent[3] - extent[1] };
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
      if (!zoom.active) return;

      const { limiterForces, output, timeStart } = zoom;
      const { animDurationMs, animEaseFn, limitToViewport } = config.zoom;

      let dx: number;
      let dy: number;
      let ds: number;

      // if instant or empty
      if (animDurationMs <= frameStart.deltaTime || !(output[0] || output[1] || output[2])) {
        dx = output[0];
        dy = output[1];
        ds = output[2];
        zoom.active = false;
      } else {
        // animate next frame
        const time = Math.min(frameStart.time - timeStart, animDurationMs);
        const prevTime = Math.max(0, time - frameStart.deltaTime);
        dx = animEaseFn(time, output[0], animDurationMs) - animEaseFn(prevTime, output[0], animDurationMs);
        dy = animEaseFn(time, output[1], animDurationMs) - animEaseFn(prevTime, output[1], animDurationMs);
        ds = animEaseFn(time, output[2], animDurationMs) - animEaseFn(prevTime, output[2], animDurationMs);
        if (time === animDurationMs) {
          zoom.active = false;
        }
      }
      if (limitToViewport) {
        physics.addForceWithLimitToExtent(limiterForces, dx, dy);
      }
      transform[0] += dx + limiterForces[2];
      transform[1] += dy + limiterForces[3];
      transform[2] += ds;
    },
  };
}
