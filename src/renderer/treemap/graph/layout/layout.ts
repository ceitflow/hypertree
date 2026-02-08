import { GraphNode } from '../index';
import { NodeLayout } from './nodes/node-layout';

export class Layout {

  constructor(root: GraphNode) {
    // todo main layout controller
    // 1. layout nodes
    // 2. draw links
    // 3. adjust nodes to make room for links
    NodeLayout.init(root);
    // todo add links to graph
  }
}
