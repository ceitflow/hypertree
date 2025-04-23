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
    const { cache, cacheSize } = inertia;
    if (reset) {
      cache.splice(0, cache.length, [x, y]);
    } else cache.push([x, y]);
    if (cache.length > cacheSize) cache.shift();
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
      const { velocity, cache, velocityThreshold } = inertia;
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

      velocity[0] = cache[cache.length - 1][0] - cache[0][0];
      velocity[1] = cache[cache.length - 1][1] - cache[0][1];

      const str = (Math.abs(velocity[0]) + Math.abs(velocity[1])) / velocityThreshold;

      inertia.varStrength = Math.min(inertia.strength + str, 96);

      // console.log(velocity, inertia.varStrength); // time stamp for each cache?
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
        const { dx, dy, isConstrainedX, isConstrainedY } = ExtentConstraint(
          diffX,
          diffY,
          transform,
          viewport,
          viewportPadding,
          extent
        );

        if (isConstrainedX) {
          if (constraint.lastValidX === null) constraint.lastValidX = current[0];
          const force = current[0] - constraint.lastValidX;
          // transformOffset[0] += (force - prevForce) / 1000;
        } else {
          // if (constraint.lastValidX !== null) transformOffset[0] -= current[0] - constraint.lastValidX;
          constraint.lastValidX = null;
        }

        prevCurrent[0] = current[0];
        prevCurrent[1] = current[1];
        constraint.dx = dx;
        constraint.dy = dy;

        transform[0] += diffX + dx;
        transform[1] += diffY + dy;
      }

      // todo animation fn, swappable easing animations
      if (zoom.active) {
        const { velocity, durationMs } = zoom;
        let time = frameStart.time - zoom.timeStart;
        if (time >= durationMs) {
          time = durationMs;
          zoom.active = false;
        }
        const prevTime = Math.max(0, time - frameStart.deltaTime);
        const easeFn = Ease.outBounce;

        const prevX = easeFn(prevTime, velocity[0], durationMs);
        const prevY = easeFn(prevTime, velocity[1], durationMs);
        const prevS = easeFn(prevTime, velocity[2], durationMs);
        const currX = easeFn(time, velocity[0], durationMs);
        const currY = easeFn(time, velocity[1], durationMs);
        const currS = easeFn(time, velocity[2], durationMs);

        transform[0] += currX - prevX;
        transform[1] += currY - prevY;
        transform[2] += currS - prevS;
      }

      // todo animation fn, swappable easing animations
      if (inertia.active) {
        const { velocity, varStrength, minVelocity } = inertia; // todo apply friction to inertia if touching the viewport border
        // todo various time functions
        // - glitch like etc.
        // - space like (low gravity)
        // todo remember pointer pos while inertia runs to animate braking and then going back to pointer pos
        // translate.active || touch.active ? brakeFriction : friction;

        if (Math.abs(velocity[0]) < minVelocity) velocity[0] = 0;
        if (Math.abs(velocity[1]) < minVelocity) velocity[1] = 0;

        if (!velocity[0] && !velocity[1]) {
          inertia.active = false;
          return;
        }
        const { dx, dy } = ExtentConstraint(velocity[0], velocity[1], transform, viewport, viewportPadding, extent);

        transform[0] += velocity[0] + dx;
        transform[1] += velocity[1] + dy;

        const friction = varStrength / 100;
        velocity[0] *= friction;
        velocity[1] *= friction;
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
    dx: isDxOppositeToConstraint ? 0 : resultX,
    dy: isDyOppositeToConstraint ? 0 : resultY,
    isConstrainedX: constrainDx !== 0,
    isConstrainedY: constrainDy !== 0,
  };
}

export function ZoomConstraint(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
