import { Args, Runner } from './cli';
import { open, mkdir } from 'fs/promises';
import path from 'path';
import { executeTemplate } from '../template';
import { CONTRACTS, CONTRACTS_DIR, SCRIPTS_DIR, TESTS_DIR, WRAPPERS_DIR } from '../paths';
import { InquirerUIProvider } from '../ui/InquirerUIProvider';
import { selectOption } from '../utils';
import arg from 'arg';

function toSnakeCase(v: string): string {
    const r = v.replace(/[A-Z]/g, (sub) => '_' + sub.toLowerCase());
    return r[0] === '_' ? r.substring(1) : r;
}

async function createFile(dir: string, name: string, template: string, replaces: { [k: string]: string }) {
    await mkdir(dir, {
        recursive: true,
    });

    const p = path.join(dir, name);
    const file = await open(p, 'a+');
    if ((await file.stat()).size > 0) {
        console.warn(`${p} already exists, not changing.`);
        await file.close();
        return p;
    }

    await file.writeFile(await executeTemplate(template, replaces));
    await file.close();
}

export const create: Runner = async (args: Args) => {
    const ui = new InquirerUIProvider();

    const localArgs = arg({
        '--type': String,
    });

    const name = args._.length > 1 && args._[1].trim().length > 0 ? args._[1].trim() : await ui.input('Contract name');

    if (name.length === 0) throw new Error(`Cannot create a contract with an empty name`);

    if (name.toLowerCase() === 'contract' || !/^[a-zA-Z0-9]+$/.test(name))
        throw new Error(`Cannot create a contract with the name '${name}'`);

    const loweredName = name.substring(0, 1).toLowerCase() + name.substring(1);

    const which = (
        await selectOption(
            [
                {
                    name: 'An empty contract',
                    value: 'empty',
                },
                {
                    name: 'A simple counter contract',
                    value: 'counter',
                },
            ],
            {
                ui,
                msg: 'What type of contract do you want to create?',
                hint: localArgs['--type'],
            }
        )
    ).value;

    const prefix = which === 'counter' ? 'counter.' : '';

    const replaces = {
        name,
        loweredName,
    };

    const contractName = toSnakeCase(name) + '.fc';

    await createFile(WRAPPERS_DIR, name + '.compile.ts', 'compile.ts.template', {
        contractPath: path.join(CONTRACTS, contractName),
    });

    await createFile(CONTRACTS_DIR, contractName, prefix + 'contract.fc.template', replaces);

    await createFile(WRAPPERS_DIR, name + '.ts', prefix + 'wrapper.ts.template', replaces);

    await createFile(TESTS_DIR, name + '.spec.ts', prefix + 'test.spec.ts.template', replaces);

    await createFile(SCRIPTS_DIR, 'deploy' + name + '.ts', prefix + 'deploy.ts.template', replaces);
};
