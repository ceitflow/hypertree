import { ScriptKind } from 'typescript';
import { FileEnum, IdPath } from './id.type';
import { DeclarationNode } from './declaration.type';

export type CodeFile = {
  type: FileEnum.Code,
  id: IdPath;
  name: string;
  depth: number;
  isExternalFile?: true; // node_modules
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
    isDefault?: true,
    name: string,
    originalName?: string,
    pathToDeclaration: IdPath
  }
  isExternal?: true;
}

export type CodeFileEmptyImport = {
  // import from './styles.css'
  type: 'empty';
  from: IdPath;
  isExternal?: true;
}

export type CodeFileReExport = {
  from: IdPath;
  token: {
    isDefault?: true;
    name: string; // (export * ...) is split to this individual reexports, so it always has a name
    originalName?: string; // if alias // todo rename to identifier
    pathToDeclaration: IdPath;
  }
}
