import { Args, Runner } from './Runner';
import { lstat, mkdir, open, readdir, readFile, access } from 'fs/promises';
import path from 'path';
import { executeTemplate, TEMPLATES_DIR } from '../template';
import { selectOption } from '../utils';
import arg from 'arg';
import { UIProvider } from '../ui/UIProvider';
import { buildOne } from '../build';
import { getConfig } from '../config/utils';
import { helpArgs, helpMessages, templateTypes } from './constants';
import { getEntityName } from '../utils/cliUtils';
import { constants as fsConstants } from 'fs';

function toSnakeCase(v: string): string {
    const r = v.replace(/[A-Z]/g, (sub) => '_' + sub.toLowerCase());
    return r[0] === '_' ? r.substring(1) : r;
}

async function createFile(templatePath: string, realPath: string, replaces: { [k: string]: string }) {
    const template = (await readFile(templatePath)).toString('utf-8');
    const lines = template.split('\n');
    const fileName = executeTemplate(lines.shift()!, replaces);
    const contents = executeTemplate(lines.join('\n'), replaces);

    const p = path.join(realPath, fileName);
    const file = await open(p, 'a+');
    if ((await file.stat()).size > 0) {
        console.warn(`${p} already exists, not changing.`);
        await file.close();
        return;
    }

    await file.writeFile(contents);
    await file.close();
}

async function createFiles(templatePath: string, realPath: string, replaces: { [k: string]: string }) {
    const contents = await readdir(templatePath);

    for (const file of contents) {
        const tp = path.join(templatePath, file);
        const rp = path.join(realPath, file);
        if ((await lstat(tp)).isDirectory()) {
            await createFiles(tp, rp, replaces);
        } else {
            await mkdir(path.dirname(rp), {
                recursive: true,
            });
            await createFile(tp, realPath, replaces);
        }
    }
}

export const create: Runner = async (args: Args, ui: UIProvider) => {
    const requiredFiles = [
        'package.json',
        'package-lock.json',
        'README.md',
        'tsconfig.json',
    ];
    for (const file of requiredFiles) {
        try {
            await access(path.join(process.cwd(), file), fsConstants.F_OK);
        } catch {
            ui.write(
                `\nBefore using 'npx blueprint create', you must initialize the project with 'npm create ton-ai@latest' or 'npx create-ton-ai@latest'.\n`
            );
            return;
        }
    }

    // Check for @ton-ai-core/blueprint in package.json
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkgRaw = await readFile(pkgPath, 'utf-8');
        const pkg = JSON.parse(pkgRaw);
        const hasBlueprint = (
            (pkg.dependencies && pkg.dependencies['@ton-ai-core/blueprint']) ||
            (pkg.devDependencies && pkg.devDependencies['@ton-ai-core/blueprint']) ||
            (pkg.peerDependencies && pkg.peerDependencies['@ton-ai-core/blueprint'])
        );
        if (!hasBlueprint) {
            ui.write(
                `\nBefore using 'npx blueprint create', you must initialize the project with 'npm create ton-ai@latest' or 'npx create-ton-ai@latest'.\n`
            );
            return;
        }
    } catch (e) {
        ui.write(`\nBefore using 'npx blueprint create', you must initialize the project with 'npm create ton-ai@latest' or 'npx create-ton-ai@latest'.\n`);
        return;
    }

    const localArgs = arg({
        '--type': String,
        ...helpArgs,
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['create']);
        return;
    }

    const name = (await getEntityName(
        localArgs._,
        async () => await ui.input('Contract name (PascalCase)')
    ))!;

    if (name.length === 0) throw new Error(`Cannot create a contract with an empty name`);

    if (name.toLowerCase() === 'contract' || !/^[A-Z][a-zA-Z0-9]*$/.test(name))
        throw new Error(`Cannot create a contract with the name '${name}'`);

    let which: string;
    const defaultType = 'tact-empty';
    if (localArgs['--type']) {
        which = localArgs['--type'];
        
        if (!templateTypes.some(t => t.value === which)) {
            throw new Error(`Invalid type: ${which}. Available options: ${templateTypes.map(t => t.value).join(', ')}`);
        }
    } else {
        which = (await selectOption(templateTypes, {
            ui,
            msg: 'What type of contract do you want to create?',
            hint: defaultType,
        })).value;
    }

    const [lang, template] = which.split('-');

    const snakeName = toSnakeCase(name);

    const replaces = {
        name,
        loweredName: name.substring(0, 1).toLowerCase() + name.substring(1),
        snakeName,
        contractPath: 'contracts/' + snakeName + '.' + (lang === 'func' ? 'fc' : (lang === 'tolk' ? 'tolk' : 'tact')),
    };

    const config = await getConfig();

    const commonPath = config?.separateCompilables ? 'common' : 'not-separated-common';

    await createFiles(path.join(TEMPLATES_DIR, lang, commonPath), process.cwd(), replaces);
    await createFiles(path.join(TEMPLATES_DIR, lang, template), process.cwd(), replaces);

    if (lang === 'tact') {
        await buildOne(name, ui);
    }
};
