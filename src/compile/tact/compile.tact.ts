import path from 'path';

import { createVirtualFileSystem, build, stdLibFiles, Options, Project } from '@tact-lang/compiler';
import { Cell } from '@ton/core';

import { BUILD_DIR } from '../../paths';

import { OverwritableVirtualFileSystem } from './OverwritableVirtualFileSystem';
import { TactCompilerConfig, TactLegacyCompilerConfig } from './config';
import { getRootTactConfig } from '../../config/tact.config';

export type TactCompileResult = {
    lang: 'tact';
    fs: Map<string, Buffer>;
    code: Cell;
    options?: Options;
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

export function getTactConfigForContract(name: string): TactCompilerConfig | undefined {
    const config = getRootTactConfig();
    const projects = config.projects.filter((project) => project.name === name);
    if (!projects.length) {
        return;
    }

    return {
        ...config,
        projects,
    };
}

function getRootTactConfigOptionsForContract(name: string): Options | undefined {
    const filteredTactConfig = getTactConfigForContract(name);

    if (!filteredTactConfig) {
        return;
    }
    const [project] = filteredTactConfig.projects;

    return project?.options;
}

export async function getTactVersion() {
    const packageJsonPath = require.resolve('@tact-lang/compiler/package.json');
    const { version } = await import(packageJsonPath);
    return version;
}

function isLegacyTactConfig(config: TactLegacyCompilerConfig | TactCompilerConfig): config is TactLegacyCompilerConfig {
    return 'lang' in config;
}

function getTactBuildProject(config: TactLegacyCompilerConfig | TactCompilerConfig, name: string): Project {
    if (isLegacyTactConfig(config)) {
        const rootConfigOptions = getRootTactConfigOptionsForContract(name);
        return {
            name: 'tact',
            path: config.target,
            output: path.join(BUILD_DIR, name),
            options: { ...rootConfigOptions, ...config.options },
        };
    }

    const project = config.projects.find((p) => p.name === name);
    if (!project) {
        throw new Error(`Config for project ${name} not found`);
    }

    return project;
}

export async function doCompileTact(
    config: TactLegacyCompilerConfig | TactCompilerConfig,
    name: string,
): Promise<TactCompileResult> {
    const fs = new OverwritableVirtualFileSystem(process.cwd());

    const buildConfig = {
        config: getTactBuildProject(config, name),
        stdlib: createVirtualFileSystem('@stdlib', stdLibFiles),
        project: fs,
    };

    const res = await build(buildConfig);
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
