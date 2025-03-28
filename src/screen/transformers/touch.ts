import { Point, State } from '../types.ts';

export function Touch({ transform, touch, motionPerFrame, motionSize }: State) {
  const addMotion = (x: number, y: number, reset?: boolean) => {
    if (reset) motionPerFrame.splice(0, motionPerFrame.length, [x, y]);
    else motionPerFrame.push([x, y]);
    if (motionPerFrame.length > motionSize) motionPerFrame.shift();
  };

  return {
    start: (touches: TouchList) => {
      for (let i = 0; i < touches.length; i++) {
        const { clientX, clientY, identifier } = touches[i];
        if (!touch.touch0) {
          addMotion(clientX, clientY, true);
          // add first touch
          const fixed: Point = [
            (clientX - transform[0]) / transform[2],
            (clientY - transform[1]) / transform[2],
          ];
          touch.touch0 = { point: [clientX, clientY], id: identifier, fixed };
          touch.taps = 1 + (touch.prevTouchTimeout !== null ? 1 : 0);
          if (touch.taps < 2) {
            touch.firstTouch = [clientX, clientY];
            touch.prevTouchTimeout = setTimeout(
              () => (touch.prevTouchTimeout = null),
              touch.touchDelay
            );
          }
        } else if (!touch.touch1 && identifier !== touch.touch0.id) {
          // add second touch
          const fixed: Point = [
            (clientX - transform[0]) / transform[2],
            (clientY - transform[1]) / transform[2],
          ];
          touch.touch1 = { point: [clientX, clientY], id: identifier, fixed };
          touch.taps = 0;
        }
      }
      touch.active = true;
    },

    move: (changedTouches: TouchList) => {
      const { touch0, touch1 } = touch;
      let updated0: Point | undefined;
      let updated1: Point | undefined;

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
          (updated1[0] - updated0[0]) * (updated1[0] - updated0[0]) +
          (updated1[1] - updated0[1]) * (updated1[1] - updated0[1]);
        const dl =
          (touch1.fixed[0] - touch0.fixed[0]) * (touch1.fixed[0] - touch0.fixed[0]) +
          (touch1.fixed[1] - touch0.fixed[1]) * (touch1.fixed[1] - touch0.fixed[1]);
        const dScale = Math.sqrt(dp / dl); // this is ratio of current dst / prev dst

        if (touch.prevScale === null) touch.prevScale = dScale;

        const currentMidPointX = (updated0[0] + updated1[0]) / 2;
        const currentMidPointY = (updated0[1] + updated1[1]) / 2;
        const prevMidPointX = (touch0.point[0] + touch1.point[0]) / 2;
        const prevMidPointY = (touch0.point[1] + touch1.point[1]) / 2;
        const fixedMidPointX = (touch0.fixed[0] + touch1.fixed[0]) / 2;
        const fixedMidPointY = (touch0.fixed[1] + touch1.fixed[1]) / 2;

        const x = currentMidPointX - fixedMidPointX * dScale;
        const y = currentMidPointY - fixedMidPointY * dScale;
        const prevX = prevMidPointX - fixedMidPointX * touch.prevScale;
        const prevY = prevMidPointY - fixedMidPointY * touch.prevScale;

        transform[0] += x - prevX;
        transform[1] += y - prevY;
        transform[2] += dScale - touch.prevScale;

        touch0.point = updated0;
        touch1.point = updated1;
        touch.prevScale = dScale;
        return;
      }

      if (touch0) {
        // translate only
        if (!updated0) return; // if no movement then skip
        const diff = [updated0[0] - touch0.point[0], updated0[1] - touch0.point[1]];
        touch0.point = updated0;
        transform[0] += diff[0];
        transform[1] += diff[1];
      }
    },

    next: () => {
      if (touch.active) {
        const t0 = touch.touch0?.point;
        if (t0) addMotion(t0[0], t0[1]);
      }
    },

    up: (changedTouches: TouchList): { dblTap: Point | null } => {
      let dblTap: Point | null = null;

      for (let i = 0; i < changedTouches.length; i++) {
        const { identifier } = changedTouches[i];
        if (touch.touch0?.id === identifier) {
          touch.touch0 = null;
        } else if (touch.touch1?.id === identifier) {
          touch.touch1 = null;
        }
      }

      // swap touch1 with touch0 if touch0 was released
      if (touch.touch1 && !touch.touch0) {
        touch.touch0 = touch.touch1;
        touch.touch1 = null;
      }

      // updates ref point
      if (touch.touch0) {
        touch.touch0.fixed = [
          (touch.touch0.point[0] - transform[0]) / transform[2],
          (touch.touch0.point[1] - transform[1]) / transform[2],
        ];
        addMotion(touch.touch0.point[0], touch.touch0.point[1]);
      } else if (touch.taps === 2) {
        const { clientX, clientY } = changedTouches[changedTouches.length - 1];
        const dst = Math.hypot(touch.firstTouch![0] - clientX, touch.firstTouch![1] - clientY);
        if (dst < touch.tapDistance) dblTap = [clientX, clientY];
      }
      if (!touch.touch0 || !touch.touch1) touch.prevScale = null;
      if (!touch.touch0 && !touch.touch1) touch.active = false;

      return { dblTap };
    },
  };
}
