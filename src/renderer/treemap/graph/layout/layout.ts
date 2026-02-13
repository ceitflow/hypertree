import { GraphModel } from '../index';
import { Router } from './router/router';
import { NodeLayout } from './nodes/node-layout';

export class Layout {
  constructor(graphModel: GraphModel) {
    // todo main layout controller
    // 1. layout nodes
    // 2. draw links
    // 3. adjust nodes to make room for links
    NodeLayout.init(graphModel.root);
    Router.init(graphModel);
  }
}
