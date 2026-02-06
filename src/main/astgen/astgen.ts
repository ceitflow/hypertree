import {
  createProgram,
  createSourceFile,
  findConfigFile,
  parseJsonConfigFileContent,
  readConfigFile,
  ScriptKind,
  ScriptTarget,
  SourceFile,
  sys
} from 'typescript';
import { Program } from './program';
import { Analyzer, IO } from './analyzer';
import { Directory, OtherFile } from '@lib/ast';
import { CreateOtherFile } from './program/other-file';

export async function AstGen(): Promise<Directory> {
  // /Users/ceitflow/WebstormProjects/koia-adminflow/adminflow
  // /Users/ceitflow/WebstormProjects/m3/coplan-visualizer
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/angular/packages
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/vscode/src
  // /Users/ceitflow/WebstormProjects/medusa/my-medusa-store-storefront
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/vue-main
  // /Users/ceitflow/WebstormProjects/paymentSavvy/chatbot-frontend
  // /Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/excalidraw-master
  const src = '/Users/ceitflow/WebstormProjects/hypertree/graphkit-test-repos/excalidraw-master';

  const configPath = findConfigFile(src, sys.fileExists);
  if (!configPath) {
    // todo create virtual tsconfig if real one isn't present
    throw new Error(`Unable to find tsconfig in: ${src}, aborting`);
  }
  // todo resolve references (multiple compiled projects)
  // "references": [{ path: './tsconfig.app.json' }, {...}]
  const configFile = readConfigFile(configPath, sys.readFile);
  const compilerOptions = parseJsonConfigFileContent(configFile.config, sys, src);
  compilerOptions.options.allowJs = true;
  compilerOptions.options.checkJs = true;
  const compiler = createProgram(compilerOptions.fileNames, compilerOptions.options);
  const analyzer = new Analyzer(src, compiler);

  const allFilesPaths = IO.readAllFiles(src);
  const codeFilePaths = new Set(compilerOptions.fileNames);
  const files = new Set<SourceFile | OtherFile>();

  allFilesPaths.forEach((filePath) => {
    if (codeFilePaths.has(filePath)) {
      const source = compiler.getSourceFile(filePath);
      if (!source) throw new Error('Cannot read source file');
      files.add(source);
    } else if (filePath.endsWith('.js')) {
      // edge case for javascript files
      const jsFile = createSourceFile(filePath, IO.readSourceFile(filePath), ScriptTarget.Latest, true, ScriptKind.JS);
      analyzer.addSourceFileId(jsFile.fileName);
      files.add(jsFile);
    } else {
      files.add(CreateOtherFile(filePath, analyzer));
    }
  });

  const program = new Program(files, analyzer);
  IO.writeOutput(program.toJSON());
  return program.root;
}
