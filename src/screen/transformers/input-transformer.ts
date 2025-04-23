import { g } from '@joint/core';
import { Ease } from '../ease.ts';
import { Rect, State, TransformType, Vector2 } from '../types.ts';

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
  //
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

    dragStop: (x: number, y: number) => {
      drag.active = false;
    },

    startInertia: () => {
      const { velocity, minVelocity, cache, friction } = inertia;
      // todo if distance small - strength low, distance large - strength big
      // calculates initial velocity
      // for (let i = 1; i < cache.length; i++) {
      //   const prev = cache[i - 1];
      //   const current = cache[i];
      //   const ratio = i / cache.length;
      //   velocity[0] += (current[0] - prev[0]) * ratio;
      //   velocity[1] += (current[1] - prev[1]) * ratio;
      // }

      // 1. integral x^0.92 up to when x^0.92 = 0.1 <- summed force applied
      // 2. use 0-1 function to output 0-1
      // 3. multiply by totalForce
      // 4. subtract prev force to only apply dx dy

      const getLimit = (v: number) =>
        Math.abs(v) <= minVelocity ? 0 : (Math.log(minVelocity) - Math.log(Math.abs(v))) / Math.log(friction);

      const integral = (v: number, limit: number) =>
        (Math.abs(v) * Math.pow(friction, limit)) / Math.log(friction) - Math.abs(v) / Math.log(friction);

      const vx = cache[cache.length - 1][0] - cache[0][0];
      const vy = cache[cache.length - 1][1] - cache[0][1];
      const xLimit = getLimit(vx);
      const yLimit = getLimit(vy);

      velocity[0] = Math.sign(vx) * integral(vx, xLimit);
      velocity[1] = Math.sign(vy) * integral(vy, yLimit);
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
      // todo animation fn, swappable easing animations
      if (drag.active) {
        cacheMotionForInertia(current[0], current[1]);
        const diffX = current[0] - prevCurrent[0];
        const diffY = current[1] - prevCurrent[1];
        const force = ExtentConstraint(diffX, diffY, transform, viewport, viewportPadding, extent);

        if (force.isConstrainedX) {
          if (constraint.lastValidX === null) constraint.lastValidX = current[0];
          const force = current[0] - constraint.lastValidX;
          // transformOffset[0] += (force - prevForce) / 1000;
        } else {
          // if (constraint.lastValidX !== null) transformOffset[0] -= current[0] - constraint.lastValidX;
          constraint.lastValidX = null;
        }

        prevCurrent[0] = current[0];
        prevCurrent[1] = current[1];
        constraint.dx = force.xForce;
        constraint.dy = force.yForce;

        transform[0] += diffX + force.xForce;
        transform[1] += diffY + force.yForce;
      }

      if (zoom.active) {
        const { velocity, durationMs, timeStart } = zoom;
        let time = frameStart.time - timeStart;
        if (time >= durationMs) {
          time = durationMs;
          zoom.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        const easeFn = Ease.outQuint; // todo put in opt. Ease.inOutBack;

        transform[0] += easeFn(time, velocity[0], durationMs) - easeFn(prevTime, velocity[0], durationMs);
        transform[1] += easeFn(time, velocity[1], durationMs) - easeFn(prevTime, velocity[1], durationMs);
        transform[2] += easeFn(time, velocity[2], durationMs) - easeFn(prevTime, velocity[2], durationMs);
      }

      if (inertia.active) {
        const { velocity, durationMs, timeStart } = inertia;
        // todo apply friction to inertia if touching the viewport border
        // todo remember pointer pos while inertia runs to animate braking and then going back to pointer pos

        let time = frameStart.time - timeStart;
        if (time >= durationMs) {
          time = durationMs;
          inertia.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);

        const easeFn = Ease.inOutBack;

        const dx = easeFn(time, velocity[0], durationMs) - easeFn(prevTime, velocity[0], durationMs);
        const dy = easeFn(time, velocity[1], durationMs) - easeFn(prevTime, velocity[1], durationMs);

        const force = ExtentConstraint(dx, dy, transform, viewport, viewportPadding, extent);

        transform[0] += dx + force.xForce;
        transform[1] += dy + force.yForce;
      }
    },
  };
}

// when moving beyond extent + padding, only allow to move in the opposite direction
// returns constraint force
export function ExtentConstraint(dx: number, dy: number, t: TransformType, view: Rect, viewportPadding: number, extent: Rect) {
  const x = t[0] + dx;
  const y = t[1] + dy;
  const scale = t[2];

  const dstToLeft = (x - view[0]) / scale - extent[0];
  const dstToTop = (y - view[1]) / scale - extent[1];
  const dstToRight = (view[2] - x) / scale - extent[2];
  const dstToBottom = (view[3] - y) / scale - extent[3];

  let leftPadding = (view[2] * viewportPadding) / scale;
  let rightPadding = (view[2] * viewportPadding) / scale;
  let topPadding = (view[3] * viewportPadding) / scale;
  let bottomPadding = (view[3] * viewportPadding) / scale;

  const heightFitInViewport = extent[3] * scale <= view[3];
  const widthFitInViewport = extent[2] * scale <= view[2];

  if (widthFitInViewport) {
    // override padding to prevent diagram going beyond viewport edge
    leftPadding = Math.max(leftPadding, dstToLeft + dstToRight);
    rightPadding = Math.max(rightPadding, dstToLeft + dstToRight);
  }
  if (heightFitInViewport) {
    topPadding = Math.max(topPadding, dstToTop + dstToBottom);
    bottomPadding = Math.max(bottomPadding, dstToTop + dstToBottom);
  }

  let constrainDx = 0;
  let constrainDy = 0;

  if (dstToLeft > leftPadding) constrainDx = leftPadding - dstToLeft;
  else if (dstToRight > rightPadding) constrainDx = dstToRight - rightPadding;

  if (dstToTop > topPadding) constrainDy = topPadding - dstToTop;
  else if (dstToBottom > bottomPadding) constrainDy = dstToBottom - bottomPadding;

  // if true then disable constraint force
  const isDxOppositeToConstraint = dx === 0 || (dx > 0 ? constrainDx >= 0 : constrainDx < 0);
  const isDyOppositeToConstraint = dy === 0 || (dy > 0 ? constrainDy >= 0 : constrainDy < 0);

  const resultX = Math.sign(constrainDx) * Math.min(Math.abs(constrainDx * scale), Math.abs(dx));
  const resultY = Math.sign(constrainDy) * Math.min(Math.abs(constrainDy * scale), Math.abs(dy));

  return {
    xForce: isDxOppositeToConstraint ? 0 : resultX,
    yForce: isDyOppositeToConstraint ? 0 : resultY,
    isConstrainedX: constrainDx !== 0,
    isConstrainedY: constrainDy !== 0,
  };
}

export function ZoomConstraint(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
