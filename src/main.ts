import './styles.css';
import { dia } from '@joint/core';
import { Diagram } from './diagram';
import { createTestUI } from './toolbar-test-ui';
import { LoadShapes } from './util/shapes.ts';

(async function init() {
  const container = document.getElementById('viewport')!;
  const paperContainer = document.getElementById('paper')!;
  const graph = new dia.Graph({});
  const paper = new dia.Paper({
    el: paperContainer,
    model: graph,
    autoFreeze: true,
    width: 400,
    height: 400,
    async: true,
    restrictTranslate: true,
    viewport: (view, isMounted, paper) => {
      return true;
    },
    // defaultRouter: {
    //   name: 'manhattan',
    //   args: {
    //     // maximumLoops: 10000,
    //     // maxAllowedDirectionChange: 900,
    //   }
    // },
    defaultConnector: {
      name: 'curve',
      args: {
        distanceCoefficient: 0.4,
      },
    },
  });
  createTestUI(container);
  const diagram = Diagram(new dia.Graph(), paper, container);
  LoadShapes(graph);

  const bbox = graph.getBBox()!.inflate(100, 100);
  paper.setDimensions(bbox.width + 400, bbox.height);
  diagram.screen.controller.zoom.zoomToFit([100, 100]);
  console.log(diagram);
})();
