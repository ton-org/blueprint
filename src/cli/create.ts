import path from 'path';
import unixPath from 'path/posix';
import { lstat, mkdir, open, readdir, readFile } from 'fs/promises';

import arg from 'arg';
import { Project } from '@tact-lang/compiler';
import chalk from 'chalk';

import { getConfig } from '../config/utils';
import { getRootTactConfig, TactConfig, updateRootTactConfig } from '../config/tact.config';
import { Args, extractFirstArg, Runner } from './Runner';
import { executeTemplate, TEMPLATES_DIR } from '../template';
import { validateContractName, selectOption, toSnakeCase } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import { buildOne } from '../build';
import { helpArgs, helpMessages, templateTypes } from './constants';

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

function getFileExtension(lang: string): string {
    if (lang === 'func') return 'fc';
    if (lang === 'tolk') return 'tolk';
    return 'tact';
}

function addToTactConfig(contractName: string, contractPath: string) {
    const tactConfig = getRootTactConfig();
    const projectConfig = {
        name: contractName,
        path: contractPath,
        output: path.join('build', contractName),
        options: {
            debug: false,
            external: false,
        },
        mode: 'full',
    } satisfies Project;

    const newConfig: TactConfig = {
        ...tactConfig,
        projects: [...tactConfig.projects, projectConfig],
    };
    updateRootTactConfig(newConfig);
}

export const create: Runner = async (_args: Args, ui: UIProvider) => {
    const localArgs = arg({
        '--type': String,
        ...helpArgs,
    });
    if (localArgs['--help']) {
        ui.write(helpMessages['create']);
        return;
    }

    const argName = extractFirstArg(localArgs);
    if (argName !== undefined) {
        const error = validateContractName(argName);
        if (error) {
            throw new Error(error);
        }
    }

    const name = argName ?? (await requestContractName('Contract name (PascalCase)', ui));

    const which = (
        await selectOption(templateTypes, {
            ui,
            msg: 'What type of contract do you want to create?',
            hint: localArgs['--type'],
        })
    ).value;

    const [lang, template] = which.split('-');

    const snakeName = toSnakeCase(name);
    const contractPath = unixPath.join('contracts', snakeName + '.' + getFileExtension(lang));

    const replaces = {
        name,
        loweredName: name.substring(0, 1).toLowerCase() + name.substring(1),
        snakeName,
        contractPath,
    };

    const config = await getConfig();

    if (lang === 'tact') {
        await createFiles(path.join(TEMPLATES_DIR, lang, template), process.cwd(), replaces);
        addToTactConfig(name, contractPath);
        await buildOne(name, ui);
    } else {
        const commonPath = config?.separateCompilables ? 'common' : 'not-separated-common';
        await createFiles(path.join(TEMPLATES_DIR, lang, commonPath), process.cwd(), replaces);
        await createFiles(path.join(TEMPLATES_DIR, lang, template), process.cwd(), replaces);
    }
};

export async function requestContractName(message: string, ui: UIProvider): Promise<string> {
    while (true) {
        const name = await ui.input(message);
        const error = validateContractName(name);
        if (error !== undefined) {
            ui.write(chalk.redBright(`Error: `) + error);
            // ask user again
            continue;
        }
        return name;
    }
}
