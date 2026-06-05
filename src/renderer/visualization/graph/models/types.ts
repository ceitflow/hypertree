import { OtherGraphNode } from './other-node';
import { VirtualGraphNode } from './virtual-node';
import { DirectoryGraphNode } from './directory-node';
import { CodeGraphNode, DeclarationGraphNode } from './code-node';

export enum GraphNodeEnum {
  Code = 'code',
  Declaration = 'declaration',
  Other = 'other',
  Directory = 'directory',
  Virtual = 'virtual'
}

export type GraphNode = DirectoryGraphNode | CodeGraphNode | OtherGraphNode | DeclarationGraphNode | VirtualGraphNode;

export type ParentType = GraphNode | null;
export type Size = { width: number; height: number };
export type BBox = { x: number; y: number; width: number; height: number };
