import { g } from '@joint/core';
import { State, Vector2 } from '../types.ts';
import { ExtentConstraint, ZoomConstraint } from '../constraint.ts';
import { Ease } from '../ease.ts';

export type InputControllerType = ReturnType<typeof InputTransformer>;

export function InputTransformer({
  frameStart,
  inertia,
  drag,
  zoom,
  constraint,
  transform,
  viewport,
  viewportPadding,
  extent,
}: State) {
  const cacheMotionForInertia = (x: number, y: number, reset?: boolean): void => {
    const { cache } = inertia;
    if (reset) {
      cache.splice(0, cache.length, [x, y]);
    } else cache.push([x, y]);
    if (cache.length > 2) cache.shift();
  };

  const invert = (x: number, y: number): Vector2 => {
    return [(x - transform[0]) / transform[2], (y - transform[1]) / transform[2]];
  };

  const invertScaleToZoomStep = (scale: number) => {
    zoom.inputStep = ZoomConstraint(
      ((Math.log(scale) - Math.log(zoom.min)) * zoom.max) / (Math.log(zoom.max) - Math.log(zoom.min)),
      zoom.min,
      zoom.max
    );
  };

  const { first, current, prevCurrent } = drag;

  // translate current zoom to zoom step
  invertScaleToZoomStep(transform[2]);

  return {
    invert,
    dragStart: (x: number, y: number) => {
      first[0] = x;
      first[1] = y;
      current[0] = x;
      current[1] = y;
      prevCurrent[0] = x;
      prevCurrent[1] = y;
      drag.active = true;
      cacheMotionForInertia(x, y, true);
    },

    drag: (x: number, y: number) => {
      current[0] = x;
      current[1] = y;
    },

    pinchDrag: (dx: number, dy: number, scale?: number) => {
      transform[0] += dx; // todo use drag() to make it work with inertia
      transform[1] += dy;
      transform[2] += scale || 0;
    },

    dragStop: () => {
      drag.active = false;
    },

    startInertia: () => {
      const { velocity, stopVelocity, cache } = inertia;
      const delta = frameStart.deltaTime;

      // f(x) = velocity * friction^x
      const integral = (v: number, friction: number, limit: number) =>
        (Math.abs(v) * Math.pow(friction, limit)) / Math.log(friction) - Math.abs(v) / Math.log(friction);

      // f(x) = 0.1 => (ln(minVelocity) - ln(velocity)) / ln(friction)
      const getLimit = (v: number, friction: number) =>
        Math.abs(v) <= stopVelocity ? 0 : (Math.log(stopVelocity) - Math.log(Math.abs(v))) / Math.log(friction);

      const vx = cache[cache.length - 1][0] - cache[0][0];
      const vy = cache[cache.length - 1][1] - cache[0][1];
      const vSum = Math.abs(vx) + Math.abs(vy);

      if (vSum <= stopVelocity) return;

      let speed = Math.max(Math.abs(vx) / delta, Math.abs(vy) / delta);
      const maxSpeed = 15;
      speed = Math.max(0, Math.min(maxSpeed, speed));
      const logValue = Math.log(speed + 1);
      const fr = 0.75 + (logValue / Math.log(maxSpeed + 1)) * 0.2;
      speed = (logValue / Math.log(maxSpeed + 1)) * 2;

      const friction = fr; //1 - Math.max(0.01, Math.min(1, threshold.friction));

      const xLimit = getLimit(vx, friction);
      const yLimit = getLimit(vy, friction);

      const duration = Math.max(xLimit * delta, yLimit * delta);
      // todo its not about averaging entire sum of distance,
      //  but rather adjusting duration so the first steps returned by easeFn are equal to vSum

      inertia.durationMs = duration / speed;

      velocity[0] = Math.sign(vx) * integral(vx, friction, xLimit);
      velocity[1] = Math.sign(vy) * integral(vy, friction, yLimit);
      console.log(fr, duration, speed);

      inertia.timeStart = frameStart.time;
      inertia.active = true;
    },

    stopInertia: () => {
      inertia.active = false;
    },

    zoom: (origin: Vector2, step: number) => {
      zoom.inputStep = ZoomConstraint(zoom.inputStep + step, zoom.min, zoom.max);
      const minLog = Math.log(zoom.min);
      const output = Math.exp(minLog + (zoom.inputStep / zoom.max) * (Math.log(zoom.max) - minLog));
      const currentZoom = transform[2];

      if (output === currentZoom) return;

      zoom.timeStart = frameStart.time;
      zoom.velocity[0] = -origin[0] * (output - currentZoom);
      zoom.velocity[1] = -origin[1] * (output - currentZoom);
      zoom.velocity[2] = output - currentZoom;
      zoom.active = true;
    },

    zoomToFit: (padding: Vector2 = [0, 0], animated = false, ignoreConstraint = true) => {
      const viewRect = new g.Rect(viewport[0], viewport[1], viewport[2] - viewport[0], viewport[3] - viewport[1]);
      const extentRect = new g.Rect(extent[0], extent[1], extent[2] - extent[0], extent[3] - extent[1]);
      const extentToViewportScale = Math.min(
        (viewRect.width - padding[0] * 2) / extentRect.width,
        (viewRect.height - padding[1] * 2) / extentRect.height
      );
      invertScaleToZoomStep(extentToViewportScale);

      transform[0] = -(extentRect.width * extentToViewportScale - viewRect.width) / 2;
      transform[1] = -(extentRect.height * extentToViewportScale - viewRect.height) / 2;
      transform[2] = extentToViewportScale;
    },

    nextFrame: () => {
      if (drag.active) {
        // todo animation fn, swappable easing animations
        cacheMotionForInertia(current[0], current[1]);
        const diffX = current[0] - prevCurrent[0];
        const diffY = current[1] - prevCurrent[1];
        const force = ExtentConstraint(diffX, diffY, transform, viewport, viewportPadding, extent);

        /*if (force.isConstrainedX) {
          if (constraint.lastValidX === null) constraint.lastValidX = current[0];
          const force = current[0] - constraint.lastValidX;
          // transformOffset[0] += (force - prevForce) / 1000;
        } else {
          // if (constraint.lastValidX !== null) transformOffset[0] -= current[0] - constraint.lastValidX;
          constraint.lastValidX = null;
        }*/

        prevCurrent[0] = current[0];
        prevCurrent[1] = current[1];
        constraint.dx = force.xForce;
        constraint.dy = force.yForce;

        transform[0] += diffX + force.xForce;
        transform[1] += diffY + force.yForce;
      }

      if (zoom.active) {
        const { velocity, durationMs, timeStart, easeFn } = zoom;
        let time = frameStart.time - timeStart;
        if (time >= durationMs) {
          time = durationMs;
          zoom.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        transform[0] += easeFn(time, velocity[0], durationMs) - easeFn(prevTime, velocity[0], durationMs);
        transform[1] += easeFn(time, velocity[1], durationMs) - easeFn(prevTime, velocity[1], durationMs);
        transform[2] += easeFn(time, velocity[2], durationMs) - easeFn(prevTime, velocity[2], durationMs);
      }

      if (inertia.active) {
        const { velocity, timeStart, durationMs, easeFn } = inertia;
        // todo apply friction to inertia if touching the viewport border
        // todo remember pointer pos while inertia runs to animate braking and then going back to pointer pos

        let time = frameStart.time - timeStart;
        if (time >= durationMs) {
          time = durationMs;
          inertia.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        const dx = easeFn(time, velocity[0], durationMs) - easeFn(prevTime, velocity[0], durationMs);
        const dy = easeFn(time, velocity[1], durationMs) - easeFn(prevTime, velocity[1], durationMs);
        // console.log(dx);

        const force = ExtentConstraint(dx, dy, transform, viewport, viewportPadding, extent);

        transform[0] += dx + force.xForce;
        transform[1] += dy + force.yForce;
      }
    },
  };
}
