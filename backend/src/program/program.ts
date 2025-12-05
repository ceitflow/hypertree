import { SourceFile } from 'typescript';
import { OtherFile } from './other-file';
import { Directory, File, Graph } from './program.type';
import { Analyzer, FileEnum, IdPath, IO } from '../analyzer';
import { CodeFileBuilder, EmptyImportFactory, ImportFactory, ReexportFactory } from './code-file';

export class Program {
  graph: Graph;

  constructor(files: Set<(SourceFile | OtherFile)>, analyzer: Analyzer) {
    const srcPath = analyzer.getProgramSrcPath();
    const srcName = srcPath.split(IO.separator).pop()!;
    this.graph = {
      name: srcName,
      root: {
        name: srcName,
        dirs: [],
        files: [],
        depth: 0,
        path: srcPath,
      },
      stats: {
        filesCount: files.size,
        externalFilesCount: 0,
        totalLoc: 0,
      },
    };
    const filesBuilder = new Map<IdPath, CodeFileBuilder>();
    const externalFiles = new Map<IdPath, SourceFile>();

    console.log(`1. build files ${files.size}`);
    for (const sourceFile of files) {
      if ('type' in sourceFile) {
        this.addToDirectoryGraph(sourceFile);
        continue;
      }
      const file = new CodeFileBuilder(sourceFile, analyzer);
      filesBuilder.set(file.id, file);
      this.graph.stats.totalLoc += file.loc;
      for (const extFile of file.cache.externalReferencedFiles) {
        if (!externalFiles.has(extFile.file.fileName)) {
          externalFiles.set(extFile.packageName, extFile.file);
          this.graph.stats.externalFilesCount++;
        }
      }
      console.log(`Converting AST graph node: ${file.id}`);
    }

    console.log(`2. build external files (${externalFiles.size})`);
    for (const [packageName, file] of externalFiles) {
      const extBuildFile = new CodeFileBuilder(file, analyzer);
      filesBuilder.set(packageName, extBuildFile);
      console.log(`Converting External AST graph node: ${packageName} (${file.fileName})`);
    }

    console.log('3. calculate reexports from other files \n \n');
    for (const file of filesBuilder.values()) {
      this.buildReExports(file, filesBuilder, analyzer);
    }

    console.log('4. calculate imports from other files \n \n');
    for (const file of filesBuilder.values()) {
      if (file.isExternalFile) {
        continue; // skip imports in files inside node_modules
      }
      file.cache.cachedImports.forEach(({ node, resolvedPath }) => {
        if (!node.importClause) {
          file.fileEmptyImports.push(EmptyImportFactory(node, analyzer));
          return;
        }
        const fromNode = filesBuilder.get(resolvedPath);
        if (!fromNode) {
          console.error(`Attempt to import file that's not registered: ${resolvedPath} from: ${file.id}`);
        } else file.fileImports.push(...ImportFactory(node, analyzer, fromNode));
      });
    }

    // build files and dirGraph
    for (const file of filesBuilder.values()) {
      const builtFile = file.build();
      // this.graph.filesMap[builtFile.id] = builtFile;
      this.addToDirectoryGraph(builtFile);
    }
  }

  private buildReExports(node: CodeFileBuilder, graph: Map<IdPath, CodeFileBuilder>, analyzer: Analyzer): void {
    if (node.recalculateAgain) {
      node.unprocessedReexportReferences = node.cache.getUniqueReExportedFiles();
      node.recalculateAgain = false;
    }
    if (!node.unprocessedReexportReferences.length || node.isExternalFile)
      // TODO support external files
      return;

    const stack: IdPath[] = [];
    stack.splice(0, stack.length);
    stack.push(node.id, ...node.unprocessedReexportReferences);

    while (stack.length) {
      const item = graph.get(stack[stack.length - 1])!;
      if (!item) {
        console.error(`Referencing file that was skipped: ${stack[stack.length - 1]} from: ${node.id}`);
        stack.pop();
        continue;
      }

      if (!item.unprocessedReexportReferences.length) {
        stack.pop(); // refs processed, going back to previous node in stack
        item.areReferencesResolved = !item.recalculateAgain;
        if (item.areReferencesResolved)
          item.cache.cachedReExports.forEach(reexport => {
            const fromNode = graph.get(reexport.fromGraphNode);
            if (!fromNode) console.error(`Referencing file that was skipped: ${reexport.fromGraphNode}`);
            else item.fileReExports.push(...ReexportFactory(reexport, analyzer, fromNode));
          });
        continue;
      }

      const ref = item.unprocessedReexportReferences.pop()!;
      if (!graph.get(ref) || graph.get(ref)!.areReferencesResolved)
        // if reference was skipped or already resolved, skip
        continue;

      const isCircularDependency = stack.includes(ref);
      if (isCircularDependency)
        stack.forEach((s, idx) => {
          // mark all (except first in stack) as recalculateAgain
          if (idx > 0) graph.get(s)!.recalculateAgain = true;
        });
      else stack.push(ref); // push to processing if not circular dependency
    }
  }

  private addToDirectoryGraph(file: File): void {
    const osSeparator = IO.separator;
    const segments = file.id.split(osSeparator); // unix or windows paths
    let temp: Directory = this.graph.root;

    if (file.type === FileEnum.Code && file.isExternalFile) {
      // gets reference to node_modules, create one if doesn't exist
      const nodemodules = this.graph.root.dirs?.find(c => c.name === 'node_modules');
      if (!nodemodules) {
        temp = { name: 'node_modules', dirs: [], files: [], depth: 1, path: 'node_modules' };
        this.graph.root.dirs!.push(temp);
      } else temp = nodemodules;
    }
    // no folders in path
    if (segments.length === 1) {
      temp.files!.push(file);
      return;
    }
    // create folder for each path segment
    segments.slice(0, -1).forEach((seg, idx) => {
      let exists = temp.dirs?.find(child => child.name === seg);
      if (!exists) {
        if (!temp.dirs) temp.dirs = [];
        exists = { name: seg, depth: idx + 1, path: segments.slice(0, idx + 1).join(osSeparator) };
        temp.dirs.push(exists);
      }
      temp = exists;
    });
    if (!temp.files) {
      temp.files = [];
    }
    temp.files.push(file);
  }

  toJSON(): string {
    const { filesCount, externalFilesCount, totalLoc } = this.graph.stats;
    console.log(`outputting json graph (${filesCount} files + ${externalFilesCount} external, total LOC: ${totalLoc})`);
    // sort
    const temp = [this.graph.root];
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
        temp.push(...item.dirs)
      }
    }
    return JSON.stringify(this.graph, undefined, 2);
  }
}
