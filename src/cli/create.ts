import { Args, Runner } from './cli';
import { open, mkdir } from 'fs/promises';
import path from 'path';
import { executeTemplate } from '../template';
import { CONTRACTS, CONTRACTS_DIR, SCRIPTS_DIR, TESTS_DIR, WRAPPERS_DIR } from '../paths';
import { InquirerUIProvider } from '../ui/InquirerUIProvider';

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

    const which = (
        await ui.choose(
            'What type of contract do you want to create?',
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
            (c) => c.name
        )
    ).value;

    const prefix = which === 'counter' ? 'counter.' : '';

    const name = args._[1];
    const loweredName = name.substring(0, 1).toLowerCase() + name.substring(1);

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
