import { Address, Cell } from "ton-core";
import path from "path";
import fs from 'fs/promises';
import { UIProvider } from "./ui/UIProvider";
import { SCRIPTS_DIR, WRAPPERS_DIR } from "./paths";

export const tonDeepLink = (address: Address, amount: bigint, body?: Cell, stateInit?: Cell) =>
    `ton://transfer/${address.toString({
        urlSafe: true,
        bounceable: true,
    })}?amount=${amount.toString()}${body ? ('&bin=' + body.toBoc().toString('base64url')) : ''}${stateInit ? ('&init=' + stateInit.toBoc().toString('base64url')) : ''}`;
    
export function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

export function oneOrZeroOf<T extends { [k: string]: boolean | undefined }>(options: T): keyof T | undefined {
    let opt: keyof T | undefined = undefined
    for (const k in options) {
        if (options[k]) {
            if (opt === undefined) {
                opt = k
            } else {
                throw new Error(`Please pick only one of the options: ${Object.keys(options).join(', ')}`)
            }
        }
    }
    return opt
}

const compileEnd = '.compile.ts'

export const findCompiles = async () =>
    (await fs.readdir(WRAPPERS_DIR)).filter(f => f.endsWith(compileEnd)).map(f => ({ path: path.join(WRAPPERS_DIR, f), name: f.slice(0, f.length - compileEnd.length) }))

export const findScripts = async () =>
    (await fs.readdir(SCRIPTS_DIR)).map(f => ({ path: path.join(SCRIPTS_DIR, f), name: path.parse(f).name }))

export async function selectFile(find: () => Promise<{ name: string, path: string }[]>, ui: UIProvider, hint?: string) {
    const files = await find();

    let selected: { name: string, path: string };

    if (hint) {
        const found = files.find(f => f.name.toLowerCase() === hint);
        if (found === undefined) {
            throw new Error(`Could not find file with name '${hint}'`)
        }
        selected = found;
        ui.write(`Using file: ${selected.name}`)
    } else {
        selected = await ui.choose("Choose file to use", files, (f) => f.name)
    }

    return {
        ...selected,
        module: await import(selected.path)
    }
}