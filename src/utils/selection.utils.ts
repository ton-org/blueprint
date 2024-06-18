import path from 'path';
import fs from 'fs/promises';
import { UIProvider } from '../ui/UIProvider';
import { SCRIPTS_DIR } from '../paths';
import { COMPILE_END, getCompilablesDirectory } from '../compile/compile';

export const findCompiles = async (directory?: string) => {
    directory ??= await getCompilablesDirectory();
    const files = await fs.readdir(directory);
    const compilables = files.filter((file) => file.endsWith(COMPILE_END));
    return compilables.map((file) => ({
        path: path.join(directory!, file),
        name: file.slice(0, file.length - COMPILE_END.length),
    }));
};

export const findScripts = async () =>
    (await fs.readdir(SCRIPTS_DIR))
        .filter((f) => f.endsWith('.ts'))
        .map((f) => ({ path: path.join(SCRIPTS_DIR, f), name: path.parse(f).name }));

export async function selectOption(
    options: { name: string; value: string }[],
    opts: {
        ui: UIProvider;
        msg: string;
        hint?: string;
    },
) {
    if (opts.hint) {
        const found = options.find((o) => o.value === opts.hint);
        if (found === undefined) {
            throw new Error(`Could not find option '${opts.hint}'`);
        }
        return found;
    } else {
        return await opts.ui.choose(opts.msg, options, (o) => o.name);
    }
}

export async function selectFile(
    files: { name: string; path: string }[],
    opts: {
        ui: UIProvider;
        hint?: string;
        import?: boolean;
    },
) {
    let selected: { name: string; path: string };

    if (opts.hint) {
        const found = files.find((f) => f.name.toLowerCase() === opts.hint?.toLowerCase());
        if (found === undefined) {
            throw new Error(`Could not find file with name '${opts.hint}'`);
        }
        selected = found;
        opts.ui.write(`Using file: ${selected.name}`);
    } else {
        if (files.length === 1) {
            selected = files[0];
            opts.ui.write(`Using file: ${selected.name}`);
        } else {
            selected = await opts.ui.choose('Choose file to use', files, (f) => f.name);
        }
    }

    return {
        ...selected,
        module: opts.import !== false ? await import(selected.path) : undefined,
    };
}
