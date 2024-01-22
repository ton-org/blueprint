import { UIProvider } from '../ui/UIProvider';
import { argSpec } from '../network/createNetworkProvider';
import { executeTemplate, TEMPLATES_DIR } from '../template';
import { Args, Runner } from './Runner';
import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'fs';

import path from 'path';
import arg from 'arg';

let template_path: string;
let template_content: string;

const createWrapperName  = (old: string) => {
    return old.split(/[-_]/).map(x => x.replace(x[0], x[0].toUpperCase())).join('');
}

const quoteString = (str: string) => {
    const quote   = "'";
    const quoted  = str.startsWith(quote) && str.endsWith(quote);
    return quoted ? str  : quote + str + quote;
}

const findFile = (dir: string, file_name: string): string => {
    const contents   = readdirSync(dir);
    let   hasFile    = contents.includes(file_name);
    let   foundPath  = "";
    if(hasFile) {
        foundPath = path.join(dir, file_name);
        if(statSync(foundPath).isFile()) {
            return foundPath;
        }
    }

    for (let entry of contents) {
        const entryPath = path.join(dir, entry);
        const stat = statSync(entryPath);
        if(stat.isDirectory()) {
            foundPath = findFile(entryPath, file_name);
            if(foundPath !== "") {
                break;
            }
        }
    }

    return foundPath;
}

const parseCompileString = (str: string, src_dir: string, ui: UIProvider) => {
    // Naive but does the job
    const tokens = str.split(/\\?\s+/).filter(t => t != '\\');

    const outputIdx = tokens.indexOf('-o');

    if(outputIdx < 0) {
        throw new Error("No output flag (-o) found in command:" + str);
    }

    const outFile     = tokens[outputIdx + 1];
    const outputName  = outFile.match(/([A-Za-z0-9\-_\\\/]*)/);

    if(outputName == null) {
        throw Error(`Something went wrong when parsing output from ${outFile}`);
    }

    const wrapperName = createWrapperName(path.basename(outputName[1]));
    const sourceFiles = tokens.filter(x => x.match(/\.func|\.fc['"]?$/) !== null)
                              .map(t => t.replace(/['"`]/g, ''))
    if(sourceFiles.length == 0) {
        throw new Error(`No source files found in command:${str}`);
    }

    for(let i = 0; i < sourceFiles.length; i++) {
        const testPath = path.join(src_dir, sourceFiles[i]);
        if(existsSync(testPath)) {
            sourceFiles[i] = quoteString(testPath);
        }
        else {
            const foundPath = findFile(src_dir, sourceFiles[i]);

            if(foundPath == "") {
                throw new Error(`${sourceFiles[i]} is not found anywhere`);
            }

            src_dir        = path.dirname(foundPath);
            sourceFiles[i] = quoteString(foundPath);
        }
    }
    return {
        name: wrapperName,
        targets: sourceFiles.join(',')
    };
}
export const convert: Runner = async (args: Args, ui: UIProvider) => {
    const localArgs = arg(argSpec);
    let filePath: string;
    if(localArgs._.length < 2) {
        filePath = await ui.input('Please specify path to convert from:');
    }
    else {
        filePath = localArgs._[1];
    }

    const content = readFileSync(filePath, {encoding: 'utf-8'});

    const srcDir         = path.dirname(filePath);
    const compileStrings = content.replace(/\\[\r?\n]+/g,'').matchAll(/\s?func\s+(.*)\n/g)

    if(compileStrings === null) {
        throw new Error(`No func related commands found in ${filePath}`)
    }

    template_path = path.join(TEMPLATES_DIR, 'func', 'common', 'wrappers', 'compile_legacy.ts.template');
    template_content = readFileSync(template_path, {encoding: 'utf-8'});

    if(!existsSync("wrappers")) {
        ui.write('Creating wrappers directory...');
        mkdirSync("wrappers");
    }

    for (let compileStr of compileStrings) {
        let parsed: {name: string, targets: string};

        try {
            parsed      = parseCompileString(compileStr[1], srcDir, ui);
        }
        catch(e: any) {
            ui.write(e.toString());
            continue;
        }

        const resTemplate = executeTemplate(template_content, parsed);
        let   lineIdx     = resTemplate.indexOf("\n");
        const contentIdx  = lineIdx + 1;
        if(resTemplate[lineIdx - 1] == "\r") {
            lineIdx--;
        }

        const fileName = path.join('wrappers',resTemplate.substr(0, lineIdx));
        const content  = resTemplate.substr(contentIdx);

        if(existsSync(fileName)) {
            ui.write(`File ${fileName} already exists!`);
            const overwrite = await ui.prompt("Do you want to overwrite it?");
            if(!overwrite) {
                ui.write(`Skipping ${fileName}`);
                continue;
            }
        }

        writeFileSync(fileName, content, {encoding: 'utf-8'});
        ui.write(`${fileName} wrapper created!`);
    }
}
