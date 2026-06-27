import { Edge } from './edges';
import { IdPath } from '@lib/ast';
import { GraphNodeBase } from './base';
import { DirectoryGraphNode } from './directory-node';

export type GraphData = {
  root: DirectoryGraphNode;
  nodes: Map<IdPath, GraphNodeBase>;
  edgesRegistry: Map<IdPath, Edge[]>; // [sourceId]: GraphLink; registry of original links
};
