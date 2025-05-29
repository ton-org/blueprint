import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

import { UIProvider } from '../ui/UIProvider';
import { getRootTactConfig } from '../config/tact.config';
import { COMPILE_END, getCompilablesDirectory } from '../compile/compile';
import { File } from '../types/file';

import { SCRIPTS_DIR } from '../paths';
import { distinct } from './object.utils';
import { getConfig } from '../config/utils';

export const findCompiles = async (directory?: string): Promise<File[]> => {
    const dir = directory ?? (await getCompilablesDirectory());
    if (!existsSync(dir)) {
        return [];
    }

    const files = await fs.readdir(dir, { recursive: (await getConfig())?.recursiveWrappers ?? false, withFileTypes: true });
    const compilables = files.filter((file) => file.isFile() && file.name.endsWith(COMPILE_END));
    return compilables.map((file) => ({
        path: path.join(file.path, file.name),
        name: file.name.slice(0, file.name.length - COMPILE_END.length),
    }));
};

export const findContracts = async () => {
    const compilables = await findCompiles();
    const tactRootConfig = getRootTactConfig();

    return distinct([
        ...compilables.map((file) => file.name),
        ...(tactRootConfig?.projects.map((project) => project.name) ?? []),
    ]);
};

export const findScripts = async (): Promise<File[]> => {
    const dirents = await fs.readdir(SCRIPTS_DIR, { recursive: true, withFileTypes: true });
    const scripts = dirents.filter((dirent) => dirent.isFile() && dirent.name.endsWith('.ts'));

    return scripts
        .map((script) => ({
            name: path.join(script.path.slice(SCRIPTS_DIR.length + 1), path.parse(script.name).name),
            path: path.join(script.path, script.name),
        }))
        .sort((a, b) => (a.name >= b.name ? 1 : -1));
};

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
    files: File[],
    opts: {
        ui: UIProvider;
        hint?: string;
        import?: boolean;
    },
) {
    let selected: File;

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
