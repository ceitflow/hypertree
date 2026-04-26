import { GraphData } from '../index';
import { clusteredForceLayout } from './nodes/force';

export class Layout {
  constructor(graphModel: GraphData) {
    clusteredForceLayout(Array.from(graphModel.nodes.values()));
    // Router.init(graphModel);
  }
}
