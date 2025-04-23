import { Vector2 } from '../types.ts';
import { InputControllerType } from '../transformers';

export function Touch(input: InputControllerType) {
  let prevTouchTimeout: NodeJS.Timeout | null = null;
  let endMultitouchTimeout: NodeJS.Timeout | null = null;
  const touchDelay: number = 200;
  const tapDistance: number = 10; // for dbl tap second one has to be near first tap
  let touch0: { id: number; point: Vector2; fixed: Vector2 } | null = null;
  let touch1: { id: number; point: Vector2; fixed: Vector2 } | null = null;
  let prevScale: number | null = null;
  let firstTouch: Vector2 | null = null;
  let taps: number = 0; // for dbl click
  let active: boolean = false;

  return {
    start: (touches: TouchList) => {
      for (let i = 0; i < touches.length; i++) {
        const { clientX, clientY, identifier } = touches[i];
        if (!touch0) {
          // addMotion(clientX, clientY, true);
          // add first touch
          const fixed = input.invert(clientX, clientY);
          touch0 = { point: [clientX, clientY], id: identifier, fixed };
          taps = 1 + (prevTouchTimeout !== null ? 1 : 0);
          if (taps < 2) {
            firstTouch = [clientX, clientY];
            prevTouchTimeout = setTimeout(() => (prevTouchTimeout = null), touchDelay);
          }
          input.dragStart(touch0.point[0], touch0.point[1]);
        } else if (!touch1 && identifier !== touch0.id) {
          // add second touch
          const fixed = input.invert(clientX, clientY);
          touch1 = { point: [clientX, clientY], id: identifier, fixed };
          taps = 0;
        }
      }
      active = true;
    },

    move: (changedTouches: TouchList) => {
      let updated0: Vector2 | undefined;
      let updated1: Vector2 | undefined;

      for (let i = 0; i < changedTouches.length; i++) {
        const { clientX, clientY, identifier } = changedTouches[i];
        if (touch0?.id === identifier) updated0 = [clientX, clientY];
        else if (touch1?.id === identifier) updated1 = [clientX, clientY];
      }

      if (touch1 && touch0) {
        if (!updated0 && !updated1) return;
        // pinch
        updated0 = updated0 ?? touch0.point;
        updated1 = updated1 ?? touch1.point;

        const dp =
          (updated1[0] - updated0[0]) * (updated1[0] - updated0[0]) + (updated1[1] - updated0[1]) * (updated1[1] - updated0[1]);
        const dl =
          (touch1.fixed[0] - touch0.fixed[0]) * (touch1.fixed[0] - touch0.fixed[0]) +
          (touch1.fixed[1] - touch0.fixed[1]) * (touch1.fixed[1] - touch0.fixed[1]);
        const dScale = Math.sqrt(dp / dl); // this is ratio of current dst / prev dst

        if (prevScale === null) prevScale = dScale;

        const currentMidPointX = (updated0[0] + updated1[0]) / 2;
        const currentMidPointY = (updated0[1] + updated1[1]) / 2;
        const prevMidPointX = (touch0.point[0] + touch1.point[0]) / 2;
        const prevMidPointY = (touch0.point[1] + touch1.point[1]) / 2;
        const fixedMidPointX = (touch0.fixed[0] + touch1.fixed[0]) / 2;
        const fixedMidPointY = (touch0.fixed[1] + touch1.fixed[1]) / 2;

        const x = currentMidPointX - fixedMidPointX * dScale;
        const y = currentMidPointY - fixedMidPointY * dScale;
        const prevX = prevMidPointX - fixedMidPointX * prevScale;
        const prevY = prevMidPointY - fixedMidPointY * prevScale;
        const constraintDscale = dScale - prevScale; //ZoomConstraint(dScale - prevScale, transform, zoom.min, zoom.max);
        // todo animated pinch zoom (inertia zoom) stops when new touch applied

        if (constraintDscale) {
          input.drag(x, y);
          // transform[0] += x - prevX;
          // transform[1] += y - prevY;
          // transform[2] += constraintDscale;
        }

        touch0.point = updated0;
        touch1.point = updated1;
        prevScale = dScale;
        return;
      }

      if (touch0) {
        // translate only
        if (!updated0) return; // if no movement then skip
        const diff = [updated0[0] - touch0.point[0], updated0[1] - touch0.point[1]];
        touch0.point = updated0;
        // const { dx, dy } = ExtentConstraint(diff[0], diff[1], state);
        input.drag(diff[0], diff[1]);
        // transform[0] += diff[0];
        // transform[1] += diff[1];
      }
    },

    next: () => {
      if (active) {
        const t0 = touch0?.point;
        // if (t0) addMotion(t0[0], t0[1]);
      }
    },

    up: (changedTouches: TouchList) => {
      let dblTap: Vector2 | null = null;

      const isTimeoutRunning = !!endMultitouchTimeout;

      if (touch0 && touch1) {
        if (endMultitouchTimeout) clearTimeout(endMultitouchTimeout);
        endMultitouchTimeout = setTimeout(() => (endMultitouchTimeout = null), touchDelay);
      }

      for (let i = 0; i < changedTouches.length; i++) {
        const { identifier } = changedTouches[i];
        if (touch0?.id === identifier) {
          touch0 = null;
        } else if (touch1?.id === identifier) {
          touch1 = null;
        }
      }

      // swap touch1 with touch0 if touch0 was released
      if (touch1 && !touch0) {
        touch0 = touch1;
        touch1 = null;
        // addMotion(touch0.point[0], touch0.point[1], true);
      }

      // updates ref point
      if (touch0) {
        touch0.fixed = input.invert(touch0.point[0], touch0.point[1]);
      } else if (taps === 2) {
        const { clientX, clientY } = changedTouches[changedTouches.length - 1];
        const dst = Math.hypot(firstTouch![0] - clientX, firstTouch![1] - clientY);
        if (dst < tapDistance) dblTap = [clientX, clientY];
      }
      if (!touch0 || !touch1) prevScale = null;
      if (!touch0 && !touch1) {
        active = false;
        if (endMultitouchTimeout) {
          clearTimeout(endMultitouchTimeout);
          endMultitouchTimeout = null;
        }
      }

      return { dblTap, multiReleased: isTimeoutRunning && !active };
    },

    isActive: () => active,
  };
}
