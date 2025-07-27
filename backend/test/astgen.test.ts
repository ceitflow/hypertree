import * as path from "node:path"
import * as os from "node:os"
import * as fs from "node:fs"
import { createAstJSON } from '../src/main';

describe('astgen basic functionality', () => {
    it('should parse another js file correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "main.js");
        fs.writeFileSync(testFile,
         `const somedata = require('../../package.json');
          const foo = "Something";
          const bar = {
            foo
          };
          exports.foo = bar.foo;
          module.exports = bar;`
         );

        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": []
        });
        const resultAst = fs.readFileSync(path.join(tmpDir, "ast_out", "main.js.json")).toString();
        expect(resultAst).toContain("\"fullName\":\"" + testFile.replaceAll("\\", "\\\\") + "\"");
        expect(resultAst).toContain("\"relativeName\":\"main.js\"");

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should parse a simple js file correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "main.js");
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");

        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": []
        });
        const resultAst = fs.readFileSync(path.join(tmpDir, "ast_out", "main.js.json")).toString();
        expect(resultAst).toContain("\"fullName\":\"" + testFile.replaceAll("\\", "\\\\") + "\"");
        expect(resultAst).toContain("\"relativeName\":\"main.js\"");

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should exclude files by relative file path correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "main.js");
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");
        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": ["main.js"]
        });
        expect(fs.existsSync(path.join(tmpDir, "ast_out", "main.js.json"))).toBeFalsy()

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should exclude files by absolute file path correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "main.js");
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");
        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": [testFile]
        });
        expect(fs.existsSync(path.join(tmpDir, "ast_out", "main.js.json"))).toBeFalsy()

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should exclude files by relative file path with dir correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "src", "main.js");
        fs.mkdirSync(path.join(tmpDir, "src"))
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");
        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": [path.join("src", "main.js")]
        });
        expect(fs.existsSync(path.join(tmpDir, "ast_out", "src", "main.js.json"))).toBeFalsy()

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should exclude files by relative dir path correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "src", "main.js");
        fs.mkdirSync(path.join(tmpDir, "src"))
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");
        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": ["src"]
        });
        expect(fs.existsSync(path.join(tmpDir, "ast_out", "src", "main.js.json"))).toBeFalsy()

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should exclude files by absolute dir path correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "src", "main.js");
        fs.mkdirSync(path.join(tmpDir, "src"))
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");
        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": [path.join(tmpDir, "src")]
        });
        expect(fs.existsSync(path.join(tmpDir, "ast_out", "main.js.json"))).toBeFalsy()

        fs.rmSync(tmpDir, {recursive: true});
    });

    it('should exclude files by regex correctly', async () => {
        const tmpDir: string = fs.mkdtempSync(path.join(os.tmpdir(), "astgen-tests"));
        const testFile = path.join(tmpDir, "main.js");
        fs.writeFileSync(testFile, "console.log(\"Hello, world!\");");
        await createAstJSON({
            src: tmpDir,
            type: "js",
            output: path.join(tmpDir, "ast_out"),
            recurse: true,
            "exclude-file": [],
            "exclude-regex": new RegExp(".*main.*", "i")
        });
        expect(fs.existsSync(path.join(tmpDir, "ast_out", "main.js.json"))).toBeFalsy()

        fs.rmSync(tmpDir, {recursive: true});
    });

});
