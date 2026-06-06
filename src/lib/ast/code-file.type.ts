import { ScriptKind } from 'typescript';
import { DeclarationNode } from './declaration.type';
import { BaseNode, NodeEnum, IdPath } from './id.type';

export type CodeFile = BaseNode<NodeEnum.Code> & {
  isExternalFile: boolean; // node_modules
  loc: number;
  linesShape: number[]; // flat [start, end] pairs per line, length = 2 * loc
  kind: keyof typeof ScriptKind;
  imports: CodeFileImport[]; // add importGroups (for knowing what was in each import together)
  definitions: DeclarationNode[];
  // todo support import fs = require("fs"); (is a different ast node in tsc)
}

export type CodeFileImport = { // todo split import by types, have shared BaseImport type with common properties
  // import { A as B } from ''
  // import default from ''
  from: IdPath;
  // empty i.e. import from './styles.css'
  token: 'empty' | {
    isDefault: boolean,
    name: string,
    originalName?: string,
    pathToDeclaration: IdPath
  }
  isExternal: boolean;
}
