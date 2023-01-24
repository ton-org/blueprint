import { Args, Runner } from "./cli";
import { open, mkdir } from "fs/promises";
import * as path from "path";
import { executeTemplate } from "./template";

function toSnakeCase(v: string): string {
    const r = v.replace(/[A-Z]/g, sub => '_' + sub.toLowerCase())
    return r[0] === '_' ? r.substring(1) : r
}

const CONTRACTS = 'contracts'
const TESTS = 'tests'
const WRAPPERS = 'wrappers'

async function createFile(dir: string, name: string, template: string, replaces: { [k: string]: string }) {
    await mkdir(dir, {
        recursive: true,
    })

    const p = path.join(dir, name)
    const file = await open(p, 'a+')
    if ((await file.stat()).size > 0) {
        console.warn(`${p} already exists, not changing.`)
        return p
    }

    await file.writeFile(await executeTemplate(template, replaces))
    await file.close()

    return p
}

export const create: Runner = async (args: Args) => {
    const name = args._[1]
    const loweredName = name.substring(0, 1).toLowerCase() + name.substring(1)

    const replaces = {
        name,
        loweredName,
    }

    const contractPath = await createFile(CONTRACTS, toSnakeCase(name) + '.fc', 'contract.fc.template', replaces)

    await createFile(WRAPPERS, name + '.ts', 'wrapper.ts.template', {
        ...replaces,
        contractPath,
    })

    await createFile(TESTS, name + '.spec.ts', 'test.spec.ts.template', {
        ...replaces,
        wrapperPathNoExt: path.join('wrappers', name),
    })
}