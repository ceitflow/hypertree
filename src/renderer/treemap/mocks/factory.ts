import { DeclarationNode, CodeFile, DeclarationEnum, Directory, FileEnum, OtherFile } from '@lib/ast';

export class Factory {
  static createCodeFile({
    id = 'id',
    name = 'name',
    depth = 0,
    loc = 1,
    kind = 'TS',
    isExternalFile,
    defaultExport,
    exports = [],
    emptyImports = [],
    imports = [],
    reexports = []
  }: Partial<CodeFile>): CodeFile {
    const result: CodeFile = {
      type: FileEnum.Code,
      id,
      name,
      depth,
      loc,
      kind,
      exports,
      emptyImports,
      imports,
      reexports
    };
    if (isExternalFile) {
      result.isExternalFile = true;
    }
    if (defaultExport) {
      result.defaultExport = defaultExport;
    }
    return result;
  }

  static createOtherFile({ id = 'id', name = 'name', loc = 1, bigFile = false }: Partial<OtherFile>): OtherFile {
    return {
      type: FileEnum.Other,
      id,
      depth: 0,
      name,
      loc,
      bigFile
    };
  }

  static createDir({ name = 'name', path = 'path', depth = 0, dirs = [], files = [] }: Partial<Directory>): Directory {
    return {
      name,
      path,
      depth,
      dirs,
      files
    };
  }

  static createDeclaration({
    id = 'id',
    name = 'name',
    depth = 1,
    loc = 1,
    referencedImportTokens = [],
    token = { category: DeclarationEnum.Unknown, type: 'unknown' }
  }: Partial<DeclarationNode>): DeclarationNode {
    return {
      id,
      name,
      depth,
      loc,
      referencedImportTokens,
      token
    };
  }
}
