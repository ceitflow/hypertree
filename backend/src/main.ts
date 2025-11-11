import { Program } from './program';
import { IO, Analyzer } from './analyzer';
import { CreateOtherFile, OtherFile } from './program/other-file';
import { createProgram, findConfigFile, parseJsonConfigFileContent, readConfigFile, SourceFile, sys } from 'typescript';

(function main() {
  // /Users/ceitflow/WebstormProjects/koia-adminflow/adminflow
  // /Users/ceitflow/WebstormProjects/m3/coplan-visualizer
  // /Users/ceitflow/WebstormProjects/prototypes/graphkit-test-repos/angular/packages
  // /Users/ceitflow/WebstormProjects/prototypes/graphkit-test-repos/vscode/src
  // /Users/ceitflow/WebstormProjects/medusa/my-medusa-store-storefront
  const src = '/Users/ceitflow/WebstormProjects/prototypes/graphkit-test-repos/angular/packages';

  const configPath = findConfigFile(src, sys.fileExists);
  if (!configPath) { // todo create virtual tsconfig if not present
    return console.warn(`Unable to find tsconfig in: ${src}, aborting`);
  }
  const configFile = readConfigFile(configPath, sys.readFile);
  const compilerOptions = parseJsonConfigFileContent(configFile.config, sys, src);
  const compiler = createProgram(compilerOptions.fileNames, compilerOptions.options);
  const analyzer = new Analyzer(src, compiler);

  const allFilesPaths = IO.readAllFiles(src);
  const codeFilePaths = new Set(compilerOptions.fileNames);
  const files = new Set<SourceFile | OtherFile>();
  allFilesPaths.forEach(filePath => {
    // todo can read real directories paths here too
    if (codeFilePaths.has(filePath)) {
      const source = compiler.getSourceFile(filePath);
      if (!source) throw new Error('Cannot read source file');
      files.add(source);
    } else {
      files.add(CreateOtherFile(filePath, analyzer));
    }
  });
  IO.writeOutput(new Program(files, analyzer).toJSON());
})();
