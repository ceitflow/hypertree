import { ExtentLimiter } from './limiters.ts';
import { AnimationState, LimitType, State } from '../../types.ts';

export const AnimateNextFrame = (
  animation: AnimationState,
  limiter: LimitType,
  { frameStart, viewport, viewportPadding, extent, transform }: State
): void => {
  const { durationMs, easeFn, output, cachedDeltas } = animation;
  const isVector3 = output.length === 3;

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

  if (durationMs <= frameStart.deltaTime) {
    dx = output[0];
    dy = output[1];
    ds = output[2];
  } else {
    let time = frameStart.time - animation.timeStart;
    if (time >= durationMs) {
      time = durationMs;
      animation.active = false;
    }
    const prevTime = Math.max(0, time - frameStart.deltaTime);
    dx = easeFn(time, output[0], durationMs) - easeFn(prevTime, output[0], durationMs); // todo store prev values
    dy = easeFn(time, output[1], durationMs) - easeFn(prevTime, output[1], durationMs);
    ds = isVector3 ? easeFn(time, output[2], durationMs) - easeFn(prevTime, output[2], durationMs) : 0;
  }

  cachedDeltas[0] = dx;
  cachedDeltas[1] = dy;
  cachedDeltas[2] = ds;

  if (limiter.toViewport) {
    const { xForce, yForce } = ExtentLimiter(dx, dy, transform, viewport, viewportPadding, extent);
    dx += xForce;
    dy += yForce;
  }

  transform[0] += dx;
  transform[1] += dy;
  transform[2] += ds;
};
