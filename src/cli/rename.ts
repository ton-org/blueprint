import arg from 'arg';
import { promises as fs, existsSync } from 'fs';
import path from 'path';

import { COMPILABLES_DIR, CONTRACTS_DIR, SCRIPTS_DIR, TACT_ROOT_CONFIG, TESTS_DIR, WRAPPERS_DIR } from '../paths';
import { Args, extractFirstArg, extractSecondArg, Runner, RunnerContext } from './Runner';
import { assertValidContractName, findContracts, toLowerCase, toSnakeCase } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import { helpArgs, helpMessages } from './constants';
import { selectContract } from './build';

export function renameExactIfRequired(
    str: string,
    replaces: Record<string, string>,
): {
    isRenamed: boolean;
    newValue: string;
} {
    let renamedString = str;
    let isRenamed = false;
    for (const [oldValue, newValue] of Object.entries(replaces)) {
        const regex = new RegExp(`\\b${oldValue}\\b`, 'g');
        if (regex.test(renamedString)) {
            isRenamed = true;
            renamedString = renamedString.replace(regex, newValue);
        }
    }

    return { isRenamed, newValue: renamedString };
}

async function renameContentInFile(filePath: string, replaces: Record<string, string>) {
    const content = await fs.readFile(filePath, 'utf8');
    const { isRenamed, newValue } = renameExactIfRequired(content, replaces);
    if (isRenamed) {
        await fs.writeFile(filePath, newValue, 'utf8');
    }
}

export async function renameExactOccurrencesInDirectory(directory: string, replaces: Record<string, string>) {
    const dir = await fs.readdir(directory, { recursive: true, withFileTypes: true });
    await Promise.all(
        dir.map(async (dir) => {
            if (!dir.isFile()) {
                return;
            }
            const filePath = path.join(dir.path, dir.name);
            await renameContentInFile(filePath, replaces);
            const pathRenameResult = renameExactIfRequired(dir.name, replaces);
            if (pathRenameResult.isRenamed) {
                await fs.rename(path.join(dir.path, dir.name), path.join(dir.path, pathRenameResult.newValue));
            }
        }),
    );
}

export const rename: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['rename']);
        return;
    }

    const oldName = await selectContract(ui, extractFirstArg(localArgs));

    const newName = extractSecondArg(localArgs) ?? (await ui.input('New contract name (PascalCase)'));
    assertValidContractName(newName);
    const contracts = await findContracts();
    if (contracts.includes(newName)) {
        ui.write(`Contract with name ${newName} already exists.`);
        process.exit(1);
    }

    const modifiers: ((name: string) => string)[] = [
        (name) => name,
        toSnakeCase,
        toLowerCase,
        (name) => `deploy${name}`,
        (name) => `increment${name}`,
        (name) => `${toLowerCase(name)}ConfigToCell`,
        (name) => `${name}Config`,
    ];

    const replaces = Object.fromEntries(modifiers.map((modifier) => [modifier(oldName), modifier(newName)]));

    for (const directory of [SCRIPTS_DIR, WRAPPERS_DIR, CONTRACTS_DIR, TESTS_DIR, COMPILABLES_DIR]) {
        if (existsSync(directory)) {
            await renameExactOccurrencesInDirectory(directory, replaces);
        }
    }
    await renameContentInFile(TACT_ROOT_CONFIG, replaces);
};
