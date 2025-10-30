import { Program } from './program';
import { IO, Analyzer } from './analyzer';
import { CreateOtherFile, OtherFile } from './program/other-file';
import { createProgram, findConfigFile, parseJsonConfigFileContent, readConfigFile, SourceFile, sys } from 'typescript';

(function main() {
  // /Users/ceitflow/WebstormProjects/koia-adminflow/adminflow
  // /Users/ceitflow/WebstormProjects/m3/coplan-visualizer
  // /Users/ceitflow/WebstormProjects/prototypes/graphkit-test-repos/angular/packages
  const srcPath = '/Users/ceitflow/WebstormProjects/koia-adminflow/adminflow';

  const configPath = findConfigFile(srcPath, sys.fileExists);
  if (!configPath) { // todo create virtual tsconfig if not present
    return console.warn(`Unable to find tsconfig in: ${srcPath}, aborting`);
  }
  const configFile = readConfigFile(configPath, sys.readFile);
  const compilerOptions = parseJsonConfigFileContent(configFile.config, sys, srcPath);
  const compiler = createProgram(compilerOptions.fileNames, compilerOptions.options);
  const analyzer = new Analyzer(srcPath, compiler);

  const allFilesPaths = IO.readAllFiles(srcPath);
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
