import { CodeFile } from './code-file.type';
import { OtherFile } from './other-file.type';
import { BaseNode, NodeEnum } from './id.type';
import { DeclarationNode } from './declaration.type';

export type File = CodeFile | OtherFile;

export type Directory = BaseNode<NodeEnum.Directory> & {
  dirs: Directory[];
  files: File[];
};

export type NodeType = Directory | File | DeclarationNode;
