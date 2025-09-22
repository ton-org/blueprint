import { promises as fs, existsSync } from 'fs';
import path from 'path';

import arg from 'arg';

import { COMPILABLES_DIR, CONTRACTS_DIR, SCRIPTS_DIR, TACT_ROOT_CONFIG, TESTS_DIR, WRAPPERS_DIR } from '../paths';
import { Args, extractFirstArg, extractSecondArg, Runner, RunnerContext } from './Runner';
import { validateContractName, findContracts, toLowerCase, toSnakeCase, extractFile } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import { helpArgs, helpMessages } from './constants';
import { selectContract } from './build';
import { requestContractName } from './create';

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

// Introduced this class to prevent fails in the middle of renaming, when the part is renamed and part is not
class RenameContext {
    constructor(readonly replaces: Record<string, string>) {}

    private effects: (() => Promise<void>)[] = [];

    async prepareRenameExactOccurrencesInDirectory(directory: string) {
        if (!existsSync(directory)) {
            return;
        }
        const dir = await fs.readdir(directory, {
            recursive: true,
            withFileTypes: true,
        });
        await Promise.all(
            dir
                .filter((dir) => dir.isFile())
                .map(extractFile)
                .map(async (dir) => {
                    const filePath = path.join(dir.path, dir.name);
                    await this.prepareRenameContentInFile(filePath);
                    const pathRenameResult = renameExactIfRequired(dir.name, this.replaces);
                    if (pathRenameResult.isRenamed) {
                        this.effects.push(() =>
                            fs.rename(path.join(dir.path, dir.name), path.join(dir.path, pathRenameResult.newValue)),
                        );
                    }
                }),
        );
    }

    async prepareRenameContentInFile(filePath: string) {
        const content = await fs.readFile(filePath, 'utf8');
        const { isRenamed, newValue } = renameExactIfRequired(content, this.replaces);
        if (isRenamed) {
            this.effects.push(() => fs.writeFile(filePath, newValue, 'utf8'));
        }
    }

    async applyEffects() {
        for (const effect of this.effects) {
            await effect();
        }
    }
}

export const rename: Runner = async (_args: Args, ui: UIProvider, _context: RunnerContext) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['rename']);
        return;
    }

    const oldName = await selectContract(ui, extractFirstArg(localArgs));

    const argName = extractSecondArg(localArgs);
    if (argName !== undefined) {
        const error = validateContractName(argName);
        if (error) {
            throw new Error(error);
        }
    }

    const newName = argName ?? (await requestContractName('New contract name (PascalCase)', ui));

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
        (name) => `${name}_${name}`,
        (name) => `increment${name}`,
        (name) => `${toLowerCase(name)}ConfigToCell`,
        (name) => `${name}Config`,
    ];

    const replaces = Object.fromEntries(modifiers.map((modifier) => [modifier(oldName), modifier(newName)]));

    ui.setActionPrompt('Renaming in progress...');

    const renameContext = new RenameContext(replaces);
    for (const directory of [SCRIPTS_DIR, WRAPPERS_DIR, CONTRACTS_DIR, TESTS_DIR, COMPILABLES_DIR]) {
        await renameContext.prepareRenameExactOccurrencesInDirectory(directory);
    }
    if (existsSync(TACT_ROOT_CONFIG)) {
        await renameContext.prepareRenameContentInFile(TACT_ROOT_CONFIG);
    }
    await renameContext.applyEffects();

    ui.clearActionPrompt();
    ui.write('Contract successfully renamed!');
};
