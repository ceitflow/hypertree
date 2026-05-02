import { GraphNodeBase } from '../models/base';
import { GraphData, GraphNodeEnum } from '../index';
import { clusteredBubblesLayout } from './nodes/force';

export class Layout {
  constructor(graphModel: GraphData) {
    clusteredBubblesLayout(graphModel.root, graphModel.nodes);
    // Router.init(graphModel);
  }
}
