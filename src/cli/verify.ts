import { Address, Cell, Contract, ContractProvider, Dictionary, toNano } from '@ton/core';
import { doCompile } from '../compile/compile';
import { UIProvider } from '../ui/UIProvider';
import { Args, Runner } from './Runner';
import path from 'path';
import { argSpec, createNetworkProvider } from '../network/createNetworkProvider';
import { selectCompile } from './build';
import arg from 'arg';

type FuncCompilerSettings = {
    compiler: 'func';
    compilerSettings: {
        funcVersion: string;
        commandLine: string;
    };
};

type TactCompilerSettings = {
    compiler: 'tact';
    compilerSettings: {
        tactVersion: string;
    };
};

type CompilerSettings = FuncCompilerSettings | TactCompilerSettings;

type SourceObject = {
    includeInCommand: boolean;
    isEntrypoint: boolean;
    isStdLib: boolean;
    hasIncludeDirectives: boolean;
    folder: string;
};

type SourcesObject = {
    knownContractHash: string; // base64
    knownContractAddress: string;
    senderAddress: string;
    sources: SourceObject[];
} & CompilerSettings;

const backends: Record<
    'mainnet' | 'testnet',
    {
        verifierRegistry: Address;
        backends: string[];
        id: string;
    }
> = {
    mainnet: {
        verifierRegistry: Address.parse('EQDS0AW7NV1w3nFwx-mmryfpH4OGQ3PXnoFGOJA_8PTHuLrw'),
        backends: [
            'https://ton-source-prod-1.herokuapp.com',
            'https://ton-source-prod-2.herokuapp.com',
            'https://ton-source-prod-3.herokuapp.com',
        ],
        id: 'orbs.com',
    },
    testnet: {
        verifierRegistry: Address.parse('EQB--CRXUbqYbqJKScEWeOrnk0TKJxB071M-WwvMpMEvq6Ed'),
        backends: ['https://ton-source-prod-testnet-1.herokuapp.com'],
        id: 'orbs-testnet',
    },
};

function removeRandom<T>(els: T[]): T {
    return els.splice(Math.floor(Math.random() * els.length), 1)[0];
}

class VerifierRegistry implements Contract {
    constructor(readonly address: Address) {}

    async getVerifiers(provider: ContractProvider) {
        const res = await provider.get('get_verifiers', []);
        const item = res.stack.readCell();
        const c = item.beginParse();
        const d = c.loadDict(Dictionary.Keys.BigUint(256), {
            serialize: () => {
                throw undefined;
            },
            parse: (s) => s,
        });

        return Array.from(d.values()).map((v) => {
            const admin = v.loadAddress();
            const quorom = v.loadUint(8);
            const pubKeyEndpoints = v.loadDict(Dictionary.Keys.BigUint(256), Dictionary.Values.Uint(32));

            return {
                admin: admin,
                quorum: quorom,
                pubKeyEndpoints: new Map<bigint, number>(Array.from(pubKeyEndpoints).map(([k, v]) => [k, v])),
                name: v.loadRef().beginParse().loadStringTail(),
                url: v.loadRef().beginParse().loadStringTail(),
            };
        });
    }
}

export const verify: Runner = async (args: Args, ui: UIProvider) => {
    const localArgs = arg(argSpec);

    const sel = await selectCompile(ui, localArgs);

    const networkProvider = await createNetworkProvider(ui, localArgs, false);

    const sender = networkProvider.sender();

    const senderAddress = sender.address;
    if (senderAddress === undefined) {
        throw new Error('Sender address needs to be known');
    }

    const network = networkProvider.network();
    if (network === 'custom') {
        throw new Error('Cannot use custom network');
    }

    const addr = (await ui.inputAddress('Deployed contract address:')).toString();;

    const result = await doCompile(sel.name);

    let src: SourcesObject;
    const fd = new FormData();

    if (result.lang === 'func') {
        for (const f of result.snapshot) {
            fd.append(f.filename, new Blob([f.content]), path.basename(f.filename));
        }

        src = {
            compiler: 'func',
            compilerSettings: {
                funcVersion: result.version,
                commandLine: '-SPA ' + result.targets.join(' '),
            },
            knownContractAddress: addr,
            knownContractHash: result.code.hash().toString('base64'),
            sources: result.snapshot.map((s) => ({
                includeInCommand: result.targets.includes(s.filename),
                isEntrypoint: result.targets.includes(s.filename),
                isStdLib: false,
                hasIncludeDirectives: true,
                folder: path.dirname(s.filename),
            })),
            senderAddress: senderAddress.toString(),
        };
    } else if (result.lang === 'tact') {
        let pkg: { name: string; content: Buffer } | undefined = undefined;
        for (const [k, v] of result.fs) {
            if (k.endsWith('.pkg')) {
                pkg = {
                    name: k,
                    content: v,
                };
                break;
            }
        }
        if (pkg === undefined) {
            throw new Error('Could not find .pkg in compilation results');
        }

        fd.append(path.basename(pkg.name), new Blob([pkg.content]), path.basename(pkg.name));

        src = {
            compiler: 'tact',
            compilerSettings: {
                tactVersion: '',
            },
            knownContractAddress: addr,
            knownContractHash: result.code.hash().toString('base64'),
            sources: [
                {
                    includeInCommand: true,
                    isEntrypoint: false,
                    isStdLib: false,
                    hasIncludeDirectives: false,
                    folder: '',
                },
            ],
            senderAddress: senderAddress.toString(),
        };
    } else {
        // future proofing

        throw new Error('Unsupported language ' + (result as any).lang);
    }

    fd.append(
        'json',
        new Blob([JSON.stringify(src)], {
            type: 'application/json',
        }),
        'blob',
    );

    const backend = backends[network];

    const verifierRegistry = networkProvider.open(new VerifierRegistry(backend.verifierRegistry));

    const verifier = (await verifierRegistry.getVerifiers()).find((v) => v.name === backend.id);
    if (verifier === undefined) {
        throw new Error('Could not find verifier');
    }

    const remainingBackends = [...backend.backends];

    const sourceResponse = await fetch(removeRandom(remainingBackends) + '/source', {
        method: 'POST',
        body: fd,
    });

    if (sourceResponse.status !== 200) {
        throw new Error('Could not compile on backend:\n' + (await sourceResponse.text()));
    }

    const sourceResult = await sourceResponse.json();

    if (sourceResult.compileResult.result !== 'similar') {
        throw new Error('The code is not similar');
    }

    let msgCell = sourceResult.msgCell;
    let acquiredSigs = 1;

    while (acquiredSigs < verifier.quorum) {
        const signResponse = await fetch(removeRandom(remainingBackends) + '/sign', {
            method: 'POST',
            body: JSON.stringify({
                messageCell: msgCell,
            }),
            headers: {'Content-Type': 'application/json'}
        });

        if (signResponse.status !== 200) {
            throw new Error('Could not compile on backend:\n' + (await signResponse.text()));
        }

        const signResult = await signResponse.json();

        msgCell = signResult.msgCell;
        acquiredSigs++;
    }

    const c = Cell.fromBoc(Buffer.from(msgCell.data))[0];

    await networkProvider.sender().send({
        to: backend.verifierRegistry,
        value: toNano('0.5'),
        body: c,
    });
};
