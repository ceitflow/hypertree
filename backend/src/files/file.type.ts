import { SourceFile } from 'typescript';
import { DeclarationNode } from './declaration.type';

export type ExternalSourceFile = {
  file: SourceFile;
  packageName: string;
}

export type IdPath = string; // path relative to options.src OR package name if external

export type ProgramGraph = {
  name: string;
  // referencedExternalPackages: string[]
  root: Directory;
  stats: {
    filesCount: number;
    externalFilesCount: number;
    totalLoc: number;
  }
}

export type Directory = {
  name: string,
  dirs?: Directory[];
  files?: File[];
  path: IdPath;
  depth: number;
};

export type File = {
  id: IdPath;
  name: string;
  depth: number;
  isExternalFile?: true; // node_modules
  loc: number;
  extension: string; // ts js etc.
  defaultExport?: DeclarationNode;
  exports: DeclarationNode[];
  emptyImports: FileEmptyImport[];
  imports: FileImportToken[]; // add importGroups (for knowing what was in each import together)
  reexports: FileReExportToken[];
}

export type FileEmptyImport = {
  // import from './styles.css'
  type: 'empty';
  from: IdPath;
  isExternal?: true;
}

export type FileImportToken = {
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

export type FileReExportToken = {
  from: IdPath;
  token: {
    isDefault?: true;
    name: string; // (export * ...) is split to this individual reexports, so it always has a name
    originalName?: string; // if alias // todo rename to identifier
    pathToDeclaration: IdPath;
  }
}
