import { Rect, TransformType } from '../types.ts';

// when moving beyond constraint allow to move in opposite direction
export function SoftConstraint(dx: number, dy: number, t: TransformType, view: Rect, extent: Rect) {
  // todo smooth brake and hard constraint limit
  // todo apply friction to inertia if touching the viewport border
  const x = t[0] + dx;
  const y = t[1] + dy;
  const scale = t[2];

  const dstToLeft = (x - view[0]) / scale - extent[0];
  const dstToTop = (y - view[1]) / scale - extent[1];
  const dstToRight = (view[2] - x) / scale - extent[2];
  const dstToBottom = (view[3] - y) / scale - extent[3];

  let leftPadding = view[2] / 2 / scale;
  let rightPadding = view[2] / 2 / scale;
  let topPadding = view[3] / 2 / scale;
  let bottomPadding = view[3] / 2 / scale;

  const heightFitInViewport = extent[3] * scale <= view[3];
  const widthFitInViewport = extent[2] * scale <= view[2];

  if (widthFitInViewport) {
    // override padding to prevent diagram go beyond viewport edge
    leftPadding = dstToLeft + dstToRight;
    rightPadding = dstToLeft + dstToRight;
  }
  if (heightFitInViewport) {
    topPadding = dstToTop + dstToBottom;
    bottomPadding = dstToTop + dstToBottom;
  }

  let constrainDx = 0;
  let constrainDy = 0;

  if (dstToLeft > leftPadding) constrainDx = leftPadding - dstToLeft;
  else if (dstToRight > rightPadding) constrainDx = dstToRight - rightPadding;

  if (dstToTop > topPadding) constrainDy = topPadding - dstToTop;
  else if (dstToBottom > bottomPadding) constrainDy = dstToBottom - bottomPadding;

  const restrictedDx = dx + constrainDx * scale;
  const isDxOppositeToConstraint = dx === 0 || (dx >= 0 ? constrainDx >= 0 : constrainDx <= 0);
  const canDxMoveAfterConstraint = dx >= 0 ? restrictedDx >= 0 : restrictedDx <= 0; // is there partial dx to hit the constraint

  const restrictedDy = dy + constrainDy * scale;
  const isDyOppositeToConstraint = dy === 0 || (dy >= 0 ? constrainDy >= 0 : constrainDy <= 0);
  const canDyMoveAfterConstraint = dy >= 0 ? restrictedDy >= 0 : restrictedDy <= 0;

  return {
    dx: isDxOppositeToConstraint ? dx : canDxMoveAfterConstraint ? restrictedDx : 0,
    dy: isDyOppositeToConstraint ? dy : canDyMoveAfterConstraint ? restrictedDy : 0,
  };
}
