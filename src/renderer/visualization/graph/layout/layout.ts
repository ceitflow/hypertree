import { GraphData } from '../index';
import { Router } from './router/router';
import { NodeLayout } from './nodes/node-layout';

export class Layout {
  constructor(graphModel: GraphData) {
    NodeLayout.init(graphModel.root);
    // Router.init(graphModel);
  }
}
