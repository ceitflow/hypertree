import { InputController } from '../scroller';

type Point = [number, number];

export function Touch({ drag, zoom, inertia, invert }: InputController) {
  const dblTapDelay: number = 200;
  const mutliDelay: number = 1000;
  const tapDistance: number = 10; // for dbl tap second one has to be near first tap
  const dblTapStrength = 0.2;

  let prevTouchTimeout: NodeJS.Timeout | null = null;
  let endMultitouchTimeout: NodeJS.Timeout | null = null;
  let touch0: { id: number; point: Point; fixed: Point } | null = null;
  let touch1: { id: number; point: Point; fixed: Point } | null = null;
  let prevScale: number | null = null;
  let firstTouch: Point | null = null;
  let taps = 0; // for dbl click
  let active = false;

  /*
    Touch(touchstart, touchmove, touchend).on(
   */

  return {
    touchstart: (e: TouchEvent) => {
      // const view = paper.findView(e.target);
      // if (view) {
      //   // todo if not multitouch
      //   inertia.stop();
      //   return;
      // }

      for (let i = 0; i < e.touches.length; i++) {
        const { clientX, clientY, identifier } = e.touches[i];
        if (!touch0) {
          // add first touch
          touch0 = { point: [clientX, clientY], id: identifier, fixed: invert(clientX, clientY) };
          taps = 1 + (prevTouchTimeout !== null ? 1 : 0);
          if (taps < 2) {
            firstTouch = [clientX, clientY];
            prevTouchTimeout = setTimeout(() => (prevTouchTimeout = null), dblTapDelay);
          }
          inertia.stop();
          drag.start(touch0.point[0], touch0.point[1]);
        } else if (!touch1 && identifier !== touch0.id) {
          // add second touch
          const fixed = invert(clientX, clientY);
          touch1 = { point: [clientX, clientY], id: identifier, fixed };
          taps = 0;
          // input.drag.stop();
        }
      }

      active = true;
    },

    touchmove: (e: TouchEvent) => {
      if (!active) return;

      e.preventDefault();
      e.stopPropagation();

      let updated0: Point | undefined;
      let updated1: Point | undefined;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const { clientX, clientY, identifier } = e.changedTouches[i];
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
        const dScale = zoom.clamp(Math.sqrt(dp / dl)); // this is ratio of current dst / prev dst

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
        const constraintDscale = dScale - prevScale;

        // todo animated pinch zoom (inertia zoom) stops when new touch applied
        drag.move(x - prevX, y - prevY, { relative: true });
        zoom.zoomStep([0, 0], constraintDscale);

        touch0.point = updated0;
        touch1.point = updated1;
        prevScale = dScale;
      } else if (touch0 && !endMultitouchTimeout) {
        // translate only
        if (!updated0) return; // if no movement then skip
        touch0.point = updated0;
        drag.move(updated0[0], updated0[1]);
      }
    },

    touchend: (e: TouchEvent) => {
      if (!active) return;

      let dblTap: Point | null = null;
      const touches = e.changedTouches;

      const isMultiTouchTimeoutRunning = !!endMultitouchTimeout;

      if (touch0 && touch1) {
        if (endMultitouchTimeout) clearTimeout(endMultitouchTimeout);
        endMultitouchTimeout = setTimeout(() => (endMultitouchTimeout = null), mutliDelay);
        inertia.clearCache();
      }

      for (let i = 0; i < touches.length; i++) {
        const { identifier } = touches[i];
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
      }

      // updates ref point
      if (touch0) {
        touch0.fixed = invert(touch0.point[0], touch0.point[1]);
      } else if (taps === 2) {
        const { clientX, clientY } = touches[touches.length - 1];
        const dst = Math.hypot(firstTouch![0] - clientX, firstTouch![1] - clientY);
        if (dst < tapDistance) dblTap = [clientX, clientY];
      }
      if (!touch0 || !touch1) prevScale = null;
      if (!touch0 && !touch1) {
        active = false;
        drag.stop();
        if (endMultitouchTimeout) {
          clearTimeout(endMultitouchTimeout);
          endMultitouchTimeout = null;
        }
      }

      const multiReleased = isMultiTouchTimeoutRunning && !active;
      if (dblTap) {
        inertia.stop();
        zoom.zoomStep(invert(dblTap[0], dblTap[1]), dblTapStrength);
      } else if (!multiReleased) {
        inertia.start();
      }
    },
  };
}
