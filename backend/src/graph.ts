import {
  DirectoryMapItem,
  EmptyImportFactory,
  ExternalSourceFile,
  FileBuilder,
  FileNode,
  IdPath,
  ImportFactory,
  ProgramGraph,
  ReexportFactory,
} from './files';
import { Analyzer } from './util';
import { SourceFile } from 'typescript';
import path from 'node:path';

export class AstGraph {
  graph: ProgramGraph;

  constructor(files: SourceFile[], analyzer: Analyzer) {
    this.graph = {
      name: '',
      files: {},
      dirGraph: {
        name: analyzer.getProgramSrcPath(),
        dirs: [],
        files: [],
        nestLevel: 0,
        path: '',
      },
    };
    const filesBuilder = new Map<IdPath, FileBuilder>();
    const externalFiles = new Map<SourceFile, ExternalSourceFile>();

    const createFile = (sourceFile: SourceFile, id?: IdPath) => {
      const file = new FileBuilder(sourceFile, analyzer);
      if (id) file.id = id;
      filesBuilder.set(file.id, file);
      for (const extFile of file.cache.externalReferencedFiles) externalFiles.set(extFile.file, extFile);
      console.log(`Converting AST graph node: ${file.id}`);
    };

    console.log(`1. build files ${files.length}`);
    for (const sourceFile of files) createFile(sourceFile);

    console.log(`2. build external files (${externalFiles.size})`);
    // todo flatten imports in externals so only its exports are extracted as a single file
    // TODO call graphs / flow analysis
    for (const extFile of externalFiles.values()) createFile(extFile.file, extFile.packageName);

    console.log('3. calculate reexports from other files \n \n');
    for (let node of filesBuilder.values()) this.buildReExports(node, filesBuilder, analyzer);

    console.log('4. calculate imports from other files \n \n');
    for (let graphNode of filesBuilder.values()) {
      graphNode.cache.cachedImports.forEach(({ node, resolvedPath }) => {
        if (!node.importClause) {
          graphNode.fileEmptyImports.push(EmptyImportFactory(node, analyzer));
          return;
        }
        const fromNode = filesBuilder.get(resolvedPath);
        if (!fromNode) console.error(`Importing file that was skipped: ${resolvedPath} from: ${graphNode.id}`);
        else graphNode.fileImports.push(...ImportFactory(node, analyzer, fromNode));
      });
    }

    // build files and dirGraph
    for (const file of filesBuilder.values()) {
      const builtFile = file.build();
      this.graph.files[builtFile.id] = builtFile;
      this.addToDirectoryGraph(builtFile);
    }
  }

  private buildReExports(node: FileBuilder, graph: Map<IdPath, FileBuilder>, analyzer: Analyzer): void {
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

  private addToDirectoryGraph(file: FileNode): void {
    const osSeparator = path.sep;
    const segments = file.id.split(osSeparator); // unix or windows paths
    let temp: DirectoryMapItem = this.graph.dirGraph;

    if (file.isExternalFile) {
      // gets reference to node_modules
      const nodemodules = this.graph.dirGraph.dirs?.find(c => c.name === 'node_modules');
      if (!nodemodules) {
        temp = { name: 'node_modules', dirs: [], files: [], nestLevel: 1, path: 'node_modules' };
        this.graph.dirGraph.dirs!.push(temp);
      } else temp = nodemodules;
    }
    if (segments.length === 1) {
      temp.files!.push({ name: segments[segments.length - 1], nestLevel: segments.length, path: file.id });
      return;
    }
    segments.slice(0, -1).forEach((seg, idx) => {
      let existing = temp.dirs?.find(child => child.name === seg);
      if (!existing) {
        if (!temp.dirs) temp.dirs = [];
        existing = { name: seg, nestLevel: idx + 1, path: segments.slice(0, idx + 1).join(osSeparator) };
        temp.dirs.push(existing);
      }
      temp = existing;
    });
    if (!temp.files) temp.files = [];
    temp.files.push({ name: segments[segments.length - 1], nestLevel: segments.length, path: file.id });
  }

  toJSON(): string {
    return JSON.stringify(this.graph, undefined, 2);
  }
}
