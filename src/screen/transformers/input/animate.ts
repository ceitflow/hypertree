import { ExtentLimiter } from './limiters.ts';
import { AnimationState, LimitType, State } from '../../types.ts';

export const AnimateNextFrame = (
  animation: AnimationState,
  limiter: LimitType,
  { frameStart, viewport, viewportPadding, extent, transform }: State
): void => {
  const { durationMs, easeFn, output, cachedDeltas } = animation;
  const isVector3 = output.length === 3;

  // if empty
  if (output.every(value => !value)) {
    animation.active = false;
    cachedDeltas[0] = 0;
    cachedDeltas[1] = 0;
    cachedDeltas[2] = 0;
    return;
  }
  let dx: number;
  let dy: number;
  let ds: number;

  // if instant
  if (durationMs <= frameStart.deltaTime) {
    dx = output[0];
    dy = output[1];
    ds = isVector3 ? output[2] : 0;
    output[0] = 0;
    output[1] = 0;
    if (isVector3) output[2] = 0;
  } else {
    // animate next frame
    const time = Math.min(frameStart.time - animation.timeStart, durationMs);
    const prevTime = Math.max(0, time - frameStart.deltaTime);
    dx = easeFn(time, output[0], durationMs) - easeFn(prevTime, output[0], durationMs); // todo store prev values
    dy = easeFn(time, output[1], durationMs) - easeFn(prevTime, output[1], durationMs);
    ds = isVector3 ? easeFn(time, output[2], durationMs) - easeFn(prevTime, output[2], durationMs) : 0;
    // if animation has finished
    if (time === durationMs) {
      output[0] = 0;
      output[1] = 0;
      if (isVector3) output[2] = 0;
    }
  }
  // if (incrementValues)
  cachedDeltas[0] = dx;
  cachedDeltas[1] = dy;
  cachedDeltas[2] = ds;

  if (limiter.toViewport) {
    const { xForce, yForce } = ExtentLimiter(dx, dy, transform, viewport, viewportPadding, extent);
    // todo if force==0 then clear physics force
    dx += xForce;
    dy += yForce;
  }
  transform[0] += dx;
  transform[1] += dy;
  transform[2] += ds;
};
