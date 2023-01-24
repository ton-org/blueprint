import { Args, Runner } from "./cli";
import { open, mkdir } from "fs/promises";
import * as path from "path";

function toSnakeCase(v: string): string {
    const r = v.replace(/[A-Z]/g, sub => '_' + sub.toLowerCase())
    return r[0] === '_' ? r.substring(1) : r
}

const CONTRACTS = 'contracts'
const TESTS = 'tests'
const WRAPPERS = 'wrappers'

async function createFile(dir: string, name: string, contents: string) {
    await mkdir(dir, {
        recursive: true,
    })

    const p = path.join(dir, name)
    const file = await open(p, 'a+')
    if ((await file.stat()).size > 0) {
        console.warn(`${p} already exists, not changing.`)
        return p
    }

    await file.writeFile(contents)
    await file.close()

    return p
}

export const create: Runner = async (args: Args) => {
    const name = args._[1]
    const loweredName = name.substring(0, 1).toLowerCase() + name.substring(1)

    const contractPath = await createFile(CONTRACTS, toSnakeCase(name) + '.fc', `#include "stdlib.fc";

() recv_internal(int my_balance, int msg_value, cell in_msg_full, slice in_msg_body) impure {

}`)

    await createFile(WRAPPERS, name + '.ts', `import { compileFunc } from "@ton-community/func-js";
import { readFileSync } from "fs";
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from "ton-core";

export type ${name}Config = {

}

export function ${loweredName}ConfigToCell(config: ${name}Config): Cell {
    return beginCell()
        .endCell()
}

export async function compile${name}(): Promise<Cell> {
    const cr = await compileFunc({
        targets: ['${contractPath}'],
        sources: (path: string) => readFileSync(path).toString(),
    })

    if (cr.status === 'error') throw new Error(cr.message)

    return Cell.fromBase64(cr.codeBoc)
}

export class ${name} implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell, data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new ${name}(address)
    }

    static async createFromConfig(config: ${name}Config, workchain = 0) {
        const code = await compile${name}()
        const data = ${loweredName}ConfigToCell(config)
        const init = { code, data }
        return new ${name}(contractAddress(workchain, init), init)
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATLY,
            body: beginCell()
                .endCell(),
        })
    }
}`)

    await createFile(TESTS, name + '.spec.ts', `import { Blockchain } from "@ton-community/sandbox";
import { toNano } from "ton-core";
import { ${name} } from "../${path.join('wrappers', name)}";
import "@ton-community/test-utils";

describe('${name}', () => {
    it('should deploy', async () => {
        const blockchain = await Blockchain.create()

        const ${loweredName} = blockchain.openContract(await ${name}.createFromConfig({

        }))

        const deployer = await blockchain.treasury('deployer')

        const deployResult = await ${loweredName}.sendDeploy(deployer.getSender(), toNano('0.05'))

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: ${loweredName}.address,
            deploy: true,
        })
    })
})`)
}