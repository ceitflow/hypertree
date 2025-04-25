import { Vector3 } from '../../types.ts';

export const cacheInertiaMotion = (x: number, y: number, timestamp: number, cache: Vector3[], reset?: boolean): void => {
  const fixedDelta = 16.6667; // store position every 60fps frame
  if (reset) {
    cache.splice(0, cache.length, [x, y, timestamp]);
  } else cache.push([x, y, timestamp]);
  for (let i = cache.length - 3; i >= 0; i--) {
    // leave 2 latest caches in case refresh rate is < 60fps
    if (timestamp - cache[i][2] > fixedDelta) cache.splice(i, 1);
  }
};

// f(x) = velocity * friction^x
export const integral = (v: number, friction: number, limit: number) =>
  (Math.abs(v) * Math.pow(friction, limit)) / Math.log(friction) - Math.abs(v) / Math.log(friction);

// f(x) = stopVelocity => (ln(stopVelocity) - ln(velocity)) / ln(friction)
export const getIntegralLimit = (v: number, friction: number, stopVelocity: number) =>
  Math.abs(v) <= stopVelocity ? 0 : (Math.log(stopVelocity) - Math.log(Math.abs(v))) / Math.log(friction);
