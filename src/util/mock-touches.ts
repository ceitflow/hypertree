import { Vector2 } from '../screen/types.ts';

export function touchDrag(element: HTMLElement, touch: { x: number; y: number; x1: number; y1: number }) {
  // Create TouchList from the provided touch points
  const start = new Touch({
    identifier: 0,
    target: element,
    clientX: touch.x,
    clientY: touch.y,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 1,
  });
  const end = new Touch({
    identifier: 0,
    target: element,
    clientX: touch.x1,
    clientY: touch.y1,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 1,
  });

  const touchStartEvent = new TouchEvent('touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [start],
    targetTouches: [start],
    changedTouches: [start],
  });
  const touchMoveEvent = new TouchEvent('touchmove', {
    bubbles: true,
    cancelable: true,
    touches: [end],
    targetTouches: [end],
    changedTouches: [end],
  });
  const touchEndEvent = new TouchEvent('touchend', {
    bubbles: true,
    cancelable: true,
    touches: [],
    targetTouches: [],
    changedTouches: [end],
  });

  // Dispatch the events
  element.dispatchEvent(touchStartEvent);
  element.dispatchEvent(touchMoveEvent);
  element.dispatchEvent(touchEndEvent);
}

export function testTwoTouches(element: HTMLElement) {
  const touch1 = new Touch({
    identifier: 0,
    target: element,
    clientX: 200,
    clientY: 200,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 1,
  });
  const touch2 = new Touch({
    identifier: 1,
    target: element,
    clientX: 500,
    clientY: 500,
    radiusX: 2.5,
    radiusY: 2.5,
    rotationAngle: 0,
    force: 1,
  });

  const start1 = new TouchEvent('touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [touch1],
    targetTouches: [touch1],
    changedTouches: [touch1],
  });
  const start2 = new TouchEvent('touchstart', {
    bubbles: true,
    cancelable: true,
    touches: [touch2],
    targetTouches: [touch2],
    changedTouches: [touch2],
  });

  const end1 = new TouchEvent('touchend', {
    bubbles: true,
    cancelable: true,
    touches: [touch1],
    targetTouches: [touch1],
    changedTouches: [touch1],
  });
  const end2 = new TouchEvent('touchend', {
    bubbles: true,
    cancelable: true,
    touches: [touch2],
    targetTouches: [touch2],
    changedTouches: [touch2],
  });

  // Dispatch the events
  element.dispatchEvent(start1);
  element.dispatchEvent(start2);
  element.dispatchEvent(end1);
  element.dispatchEvent(end2);
}

export function pinchZoom(
  element: HTMLElement,
  touch1: { from: Vector2; to: Vector2 },
  touch2: { from: Vector2; to: Vector2 },
  interpolateStepCount = 10
) {
  const dxTouch1 = [
    (touch1.from[0] - touch1.to[0]) / interpolateStepCount,
    (touch1.from[1] - touch1.to[1]) / interpolateStepCount,
  ];
  const dxTouch2 = [
    (touch2.from[0] - touch2.to[0]) / interpolateStepCount,
    (touch2.from[1] - touch2.to[1]) / interpolateStepCount,
  ];
  for (let i = 0; i <= interpolateStepCount; i++) {
    if (i === 0) {
      // start
      const touch1Start = new Touch({
        identifier: 0,
        target: element,
        clientX: touch1.from[0],
        clientY: touch1.from[1],
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 1,
      });
      const touch2Start = new Touch({
        identifier: 1,
        target: element,
        clientX: touch2.from[0],
        clientY: touch2.from[1],
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 1,
      });
      const start = new TouchEvent('touchstart', {
        bubbles: true,
        cancelable: true,
        touches: [touch1Start, touch2Start],
        targetTouches: [touch1Start, touch2Start],
        changedTouches: [touch1Start, touch2Start],
      });
      element.dispatchEvent(start);
      continue;
    }
    if (i === interpolateStepCount) {
      const touch1End = new Touch({
        identifier: 0,
        target: element,
        clientX: touch1.to[0],
        clientY: touch1.to[1],
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 1,
      });
      const touch2End = new Touch({
        identifier: 1,
        target: element,
        clientX: touch2.to[0],
        clientY: touch2.to[1],
        radiusX: 2.5,
        radiusY: 2.5,
        rotationAngle: 0,
        force: 1,
      });
      const end = new TouchEvent('touchend', {
        bubbles: true,
        cancelable: true,
        touches: [],
        targetTouches: [],
        changedTouches: [touch1End, touch2End],
      });
      element.dispatchEvent(end);
      continue;
    }

    const touch1Move = new Touch({
      identifier: 0,
      target: element,
      clientX: touch1.from[0] + i * dxTouch1[0],
      clientY: touch1.from[1] + i * dxTouch1[1],
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 0,
      force: 1,
    });
    const touch2Move = new Touch({
      identifier: 1,
      target: element,
      clientX: touch2.from[0] + i * dxTouch2[0],
      clientY: touch2.from[1] + i * dxTouch2[1],
      radiusX: 2.5,
      radiusY: 2.5,
      rotationAngle: 0,
      force: 1,
    });
    const move = new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [],
      targetTouches: [],
      changedTouches: [touch1Move, touch2Move],
    });
    element.dispatchEvent(move);
  }
}
