import { Rect, TransformType } from '../types.ts';

// TODO Limit Input To Extent plugin
// - input dx dy
// - output stores forces


// when moving beyond extent + padding, only allow to move in opposite direction
// returns constraint force
export function ExtentLimiter(dx: number, dy: number, t: TransformType, view: Rect, viewportPadding: number, extent: Rect) {
  const x = t[0] + dx;
  const y = t[1] + dy;
  const scale = t[2];
  if (Number.isNaN(scale)) throw new Error('isNaN(scale)')

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
    // when all of viewport is visible, override padding to prevent diagram going beyond viewport edge
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
