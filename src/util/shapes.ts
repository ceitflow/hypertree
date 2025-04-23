import { dia, shapes, util } from '@joint/core';

export const CreateNodeShape = (): dia.Element => {
  return new shapes.standard.Rectangle({
    position: { x: 2180, y: 1300 },
    size: { width: 280, height: 140 },
    attrs: {
      foreignObject: {
        width: 'calc(w)',
        height: 'calc(h)',
        x: 0,
        y: 0,
      },
    },
    markup: util.svg`
         <foreignObject @selector="foreignObject" style="overflow: visible; transform-style: preserve-3d; perspective: 500px">
            <div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; background-color: floralwhite; height: 100%">
               <div style="background-color: indianred; flex:1"></div>
            </div>
         </foreignObject>`,
  });
};
