import { Point, TransformType } from '../types.ts';

export class Touch {
  touch0: { id: number; point: Point; fixed: Point } | null = null;
  touch1: { id: number; point: Point; fixed: Point } | null = null;
  prevS: number | null = null;

  touchStart(evt: TouchEvent, transform: TransformType): void {
    const touches = evt.touches;

    for (let i = 0; i < touches.length; i++) {
      const { clientX, clientY, identifier } = touches[i];
      if (!this.touch0) {
        const fixed: Point = [
          (clientX - transform[0]) / transform[2],
          (clientY - transform[1]) / transform[2],
        ];
        this.touch0 = { point: [clientX, clientY], id: identifier, fixed };
      } else if (!this.touch1 && identifier !== this.touch0.id) {
        const fixed: Point = [
          (clientX - transform[0]) / transform[2],
          (clientY - transform[1]) / transform[2],
        ];
        this.touch1 = { point: [clientX, clientY], id: identifier, fixed };
      }
    }
  }

  touchMove(evt: TouchEvent, transform: TransformType): void {
    const touches = evt.changedTouches;
    const { touch0, touch1 } = this;
    let updated0: Point | undefined;
    let updated1: Point | undefined;

    for (let i = 0; i < touches.length; i++) {
      const { clientX, clientY, identifier } = touches[i];
      if (touch0?.id === identifier) updated0 = [clientX, clientY];
      else if (touch1?.id === identifier) updated1 = [clientX, clientY];
    }

    if (touch1 && touch0 && (updated0 || updated1)) {
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
      if (this.prevS === null) this.prevS = dScale;

      const currentMidPointX = (updated0[0] + updated1[0]) / 2;
      const currentMidPointY = (updated0[1] + updated1[1]) / 2;
      const prevMidPointX = (touch0.point[0] + touch1.point[0]) / 2;
      const prevMidPointY = (touch0.point[1] + touch1.point[1]) / 2;
      const fixedMidPointX = (touch0.fixed[0] + touch1.fixed[0]) / 2;
      const fixedMidPointY = (touch0.fixed[1] + touch1.fixed[1]) / 2;

      const x = currentMidPointX - fixedMidPointX * dScale;
      const y = currentMidPointY - fixedMidPointY * dScale;
      const prevX = prevMidPointX - fixedMidPointX * this.prevS;
      const prevY = prevMidPointY - fixedMidPointY * this.prevS;

      transform[0] += x - prevX;
      transform[1] += y - prevY;
      transform[2] += dScale - this.prevS;

      touch0.point = updated0;
      touch1.point = updated1;
      this.prevS = dScale;
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
  }

  touchEnd(evt: TouchEvent, transform: TransformType): void {
    const touches = evt.changedTouches;

    for (let i = 0; i < touches.length; i++) {
      const { identifier } = touches[i];
      if (this.touch0?.id === identifier) {
        this.touch0 = null;
      } else if (this.touch1?.id === identifier) {
        this.touch1 = null;
      }
    }
    if (this.touch1 && !this.touch0) {
      this.touch0 = this.touch1;
      this.touch1 = null;
    }
    // updates ref point
    if (this.touch0) {
      this.touch0.fixed = [
        (this.touch0.point[0] - transform[0]) / transform[2],
        (this.touch0.point[1] - transform[1]) / transform[2],
      ];
    }
    if (!this.touch1 || !this.touch0) this.prevS = null;
  }
}
