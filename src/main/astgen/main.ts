import {
  createProgram,
  createSourceFile,
  findConfigFile,
  parseJsonConfigFileContent,
  readConfigFile,
  ScriptKind,
  ScriptTarget,
  SourceFile,
  sys,
} from 'typescript';
import { Program } from './program';
import { Analyzer, IO } from './analyzer';
import { CreateOtherFile, OtherFile } from './program/other-file';

export async function AST() {
  // /Users/ceitflow/WebstormProjects/koia-adminflow/adminflow
  // /Users/ceitflow/WebstormProjects/m3/coplan-visualizer
  // /Users/ceitflow/WebstormProjects/graphkit-test-repos/angular/packages
  // /Users/ceitflow/WebstormProjects/graphkit-test-repos/vscode/src
  // /Users/ceitflow/WebstormProjects/medusa/my-medusa-store-storefront
  // /Users/ceitflow/WebstormProjects/graphkit-test-repos/vue-main
  // /Users/ceitflow/WebstormProjects/paymentSavvy/chatbot-frontend
  const src = '/Users/ceitflow/WebstormProjects/koia-adminflow/adminflow';

  const configPath = findConfigFile(src, sys.fileExists);
  if (!configPath) {
    // todo create virtual tsconfig if real one isn't present
    return console.warn(`Unable to find tsconfig in: ${src}, aborting`);
  }
  // todo resolve references
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

  allFilesPaths.forEach(filePath => {
    if (codeFilePaths.has(filePath)) {
      const source = compiler.getSourceFile(filePath);
      if (!source) throw new Error('Cannot read source file');
      files.add(source);
    } else if (filePath.endsWith('.js')) {
      // edge case for javascript files
      const jsFile = createSourceFile(filePath, IO.readSourceFile(filePath), ScriptTarget.Latest, true, ScriptKind.JS);
      analyzer.addSourceFileId(jsFile.fileName)
      files.add(jsFile);
    } else {
      files.add(CreateOtherFile(filePath, analyzer));
    }
  });
  const program = new Program(files, analyzer);
  IO.writeOutput(program.toJSON());
}
