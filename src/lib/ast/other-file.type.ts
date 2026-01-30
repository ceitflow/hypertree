import { BaseNode, NodeEnum } from './id.type';

export type OtherFile = BaseNode<NodeEnum.Other> & {
  loc: number; // invalid for binary files
  bigFile: boolean;
}
