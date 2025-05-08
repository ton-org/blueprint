import { existsSync, readFileSync } from 'fs';
import path from 'path';

import * as Tact from '@tact-lang/compiler';
import { Cell } from '@ton/core';

import { BUILD_DIR, TACT_ROOT_CONFIG } from '../../paths';

import { OverwritableVirtualFileSystem } from './OverwritableVirtualFileSystem';
import { TactCompilerConfig } from './config';

export type TactCompileResult = {
    lang: 'tact';
    fs: Map<string, Buffer>;
    code: Cell;
    options?: TactCompilerConfig['options'];
    version: string;
};

function findTactBoc(fs: Map<string, Buffer>): Cell {
    let buf: Buffer | undefined = undefined;
    for (const [k, v] of fs) {
        if (k.endsWith('.code.boc')) {
            buf = v;
            break;
        }
    }
    if (buf === undefined) {
        throw new Error('Could not find boc in tact compilation result');
    }
    return Cell.fromBoc(buf)[0];
}

function getRootTactConfigOptionsForContract(name: string): TactCompilerConfig['options'] | undefined {
    if (!existsSync(TACT_ROOT_CONFIG)) {
        return undefined;
    }

    const config: Tact.Config = Tact.parseConfig(readFileSync(TACT_ROOT_CONFIG).toString());

    for (const project of config.projects) {
        if (project.name === name) {
            return project.options;
        }
    }

    return undefined;
}

export async function getTactVersion() {
    const packageJsonPath = require.resolve('@tact-lang/compiler/package.json');
    const { version } = await import(packageJsonPath);
    return version;
}

export async function doCompileTact(config: TactCompilerConfig, name: string): Promise<TactCompileResult> {
    const rootConfigOptions = getRootTactConfigOptionsForContract(name);
    const fs = new OverwritableVirtualFileSystem(process.cwd());

    const buildConfig = {
        config: {
            name: 'tact',
            path: config.target,
            output: path.join(BUILD_DIR, name),
            options: { ...rootConfigOptions, ...config.options },
        },
        stdlib: Tact.createVirtualFileSystem('@stdlib', Tact.stdLibFiles),
        project: fs,
    };

    const res = await Tact.build(buildConfig);

    if (!res.ok) {
        throw new Error('Could not compile tact');
    }

    const code = findTactBoc(fs.overwrites);

    return {
        lang: 'tact',
        fs: fs.overwrites,
        code,
        options: buildConfig.config.options,
        version: await getTactVersion(),
    };
}
