import { ScriptKind } from 'typescript';
import { DeclarationNode } from './declaration.type';
import { BaseNode, NodeEnum, IdPath } from './id.type';

export type CodeFile = BaseNode<NodeEnum.Code> & {
  isExternalFile: boolean; // node_modules
  loc: number;
  kind: keyof typeof ScriptKind;
  defaultExport?: DeclarationNode;
  exports: DeclarationNode[];
  emptyImports: CodeFileEmptyImport[];
  imports: CodeFileImport[]; // add importGroups (for knowing what was in each import together)
  reexports: CodeFileReExport[];
}

export type CodeFileImport = {
  // import { A as B } from ''
  // import default from ''
  from: IdPath;
  token: {
    isDefault: boolean,
    name: string,
    originalName?: string,
    pathToDeclaration: IdPath
  }
  isExternal: boolean;
}

export type CodeFileEmptyImport = {
  // import from './styles.css'
  type: 'empty';
  from: IdPath;
  isExternal: boolean;
}

export type CodeFileReExport = {
  from: IdPath;
  token: {
    isDefault: boolean;
    name: string; // (export * ...) is split to this individual reexports, so it always has a name
    originalName?: string; // if alias // todo rename to identifier
    pathToDeclaration: IdPath;
  }
}
