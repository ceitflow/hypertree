import { dia, shapes, util } from "@joint/core";

export const CreateNodeShape = (): dia.Element => {
  return new shapes.standard.Rectangle({
    size: { width: 250, height: 68 },
    attrs: {
      foreignObject: {
        width: 'calc(w)',
        height: 'calc(h)',
        x: 0,
        y: 0
      }
    },
    markup: util.svg`
     <foreignObject @selector="foreignObject" class="overflow-visible">
        <div xmlns="http://www.w3.org/1999/xhtml" class="diagram-node-container">
          <span>Name</span>
        </div>
    </foreignObject>
  `
  });
};