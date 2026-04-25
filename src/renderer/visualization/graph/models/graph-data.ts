import { Edge } from './edges';
import { IdPath } from '@lib/ast';
import { DirectoryGraphNode } from './directory-node';

export type GraphData = {
  root: DirectoryGraphNode;
  edgesRegistry: Map<IdPath, Edge[]>; // [sourceId]: GraphLink; registry of original links
};
