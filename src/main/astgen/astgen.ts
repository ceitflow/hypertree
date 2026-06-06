import ts from 'typescript';
import { Analyzer, IO } from './analyzer';
import { Directory, File, IdPath, NodeEnum, OtherFile } from '@lib/ast';
import { CodeFileBuilder, CreateDirectory, CreateOtherFile } from './program';

export class AstGen {
  run(src: string) {
    const tsCompiler = this.createTsCompiler(src);
    const analyzer = new Analyzer(src, tsCompiler);
    const files = this.readFiles(src, tsCompiler, analyzer);

    const srcPath = analyzer.getProgramSrcPath();
    const root = CreateDirectory(srcPath, 0);

    const codeFilesGraph = new Map<IdPath, CodeFileBuilder>(); // build declarations and calculate reexports paths

    console.log(`1. build files ${files.size}`);

    // build declarations in each code file
    for (const sourceFile of files) {
      if ('type' in sourceFile) {
        this.registerFileInGraph(sourceFile, root); // other file
        continue;
      }
      const file = new CodeFileBuilder(sourceFile, analyzer);
      file.buildDefinitions();
      codeFilesGraph.set(file.code.id, file);
    }

    console.log('2. calculate imports from other files \n \n');
    // once all files declarations are processed, process each file imports
    for (const file of codeFilesGraph.values()) {
      file.buildImports(codeFilesGraph);
    }

    // build exports
    for (const file of codeFilesGraph.values()) {
      file.buildExports(codeFilesGraph);
    }

    // build files and dirGraph
    for (const file of codeFilesGraph.values()) {
      const builtFile = file.toJson();
      this.registerFileInGraph(builtFile, root);
    }
    IO.writeOutput(this.toJSON(root));
  }

  private createTsCompiler(src: IdPath) {
    // 1. read tsconfig
    const configPath = ts.findConfigFile(src, ts.sys.fileExists);
    if (!configPath) {
      // todo create virtual tsconfig if real one isn't present
      throw new Error(`Unable to find tsconfig in: ${src}, aborting`);
    }
    // todo resolve references (multiple compiled projects) // "references": [{ path: './tsconfig.app.json' }, {...}]
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, src);
    compilerOptions.options.allowJs = true;
    compilerOptions.options.checkJs = false;
    const compiler = ts.createProgram(compilerOptions.fileNames, compilerOptions.options);
    return compiler;
  }

  private readFiles(src: string, compiler: ts.Program, analyzer: Analyzer): Set<ts.SourceFile | OtherFile> {
    const allFilesPaths = IO.readAllFiles(src);
    const codeFilePaths = new Set(compiler.getRootFileNames());
    const files = new Set<ts.SourceFile | OtherFile>();

    allFilesPaths.forEach((filePath) => {
      if (codeFilePaths.has(filePath)) {
        const source = compiler.getSourceFile(filePath);
        if (!source) throw new Error('Cannot read source file');
        files.add(source);
      } else if (filePath.endsWith('.js')) {
        // edge case for javascript files
        const jsFile = ts.createSourceFile(
          filePath,
          IO.readSourceFile(filePath),
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.JS
        );
        analyzer.addSourceFileId(jsFile.fileName);
        files.add(jsFile);
      } else {
        files.add(CreateOtherFile(filePath, analyzer));
      }
    });

    return files;
  }

  private registerFileInGraph(file: File, root: Directory): void {
    const osSeparator = IO.separator;
    const segments = file.id.split(osSeparator); // unix or windows path
    let temp: Directory = root;

    if (file.type === NodeEnum.Code && file.isExternalFile) {
      // gets reference to node_modules, create one if doesn't exist
      const nodemodules = root.dirs.find((c) => c.name === 'node_modules');
      if (!nodemodules) {
        temp = CreateDirectory('node_modules', 1);
        root.dirs.push(temp);
      } else {
        temp = nodemodules;
      }
    }
    // no folders in path
    if (segments.length === 1) {
      temp.files.push(file);
      return;
    }
    // create folder for each path segment
    segments.slice(0, -1).forEach((seg, idx) => {
      let exists = temp.dirs?.find((child) => child.name === seg);
      if (!exists) {
        if (!temp.dirs) temp.dirs = [];
        exists = CreateDirectory(segments.slice(0, idx + 1).join(osSeparator), idx + 1);
        temp.dirs.push(exists);
      }
      temp = exists;
    });
    if (!temp.files) {
      temp.files = [];
    }
    temp.files.push(file);
  }

  toJSON(root: Directory): string {
    const temp = [root];

    while (temp.length) {
      const item = temp.pop()!;
      if (item.name === 'node_modules') {
        item.dirs = [];
        item.files = [];
        continue;
      }
      if (item.files) item.files.sort((a, b) => a.name.localeCompare(b.name));
      if (item.dirs) {
        item.dirs.sort((a, b) => a.name.localeCompare(b.name));
        temp.push(...item.dirs);
      }
    }
    return JSON.stringify(root, undefined, 2);
  }
}
