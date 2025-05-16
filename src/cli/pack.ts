import { execSync } from 'child_process';
import path from 'path';
import arg from 'arg';
import { promises as fs, existsSync } from 'fs';

import { Args, Runner, RunnerContext } from './Runner';
import { UIProvider } from '../ui/UIProvider';
import { helpArgs, helpMessages } from './constants';
import { buildAll } from '../build';
import { BUILD_DIR, PACKAGE_JSON, TYPESCRIPT_CONFIG } from '../paths';
import { distinct, findContracts } from '../utils';
import { getCompilerConfigForContract } from '../compile/compile';
import { isCompilableConfig } from '../compile/CompilerConfig';
import { extractContractConfig } from '../compile/tact/compile.tact';

async function correctTsConfig() {
    if (!existsSync(TYPESCRIPT_CONFIG)) {
        throw new Error('TypeScript config does not exist. Ensure the command runs in the correct environment.');
    }

    const tsConfig = JSON.parse(await fs.readFile(TYPESCRIPT_CONFIG, 'utf-8'));

    const newConfig = {
        ...tsConfig,
        compilerOptions: {
            ...tsConfig.compilerOptions,
            outDir: 'dist',
            module: 'commonjs',
            declaration: true,
            esModuleInterop: true,
        },
        include: distinct([...(tsConfig.include ?? []), 'wrappers/**/*', 'build/**/*']),
        exclude: distinct([...(tsConfig.exclude ?? []), '**/*.compile.ts']),
    };

    await fs.writeFile(TYPESCRIPT_CONFIG, JSON.stringify(newConfig, null, 2), 'utf8');
}

async function resolveContract(contract: string) {
    const config = await getCompilerConfigForContract(contract);

    if (isCompilableConfig(config)) {
        const buildArtifactPath = path.join(BUILD_DIR, `${contract}.compiled.json`);
        const buildArtifact = JSON.parse(await fs.readFile(buildArtifactPath, 'utf8'));
        await fs.appendFile(path.join('dist', 'wrappers', `${contract}.d.ts`), `export declare const code: Cell;`);
        await fs.appendFile(
            path.join('dist', 'wrappers', `${contract}.js`),
            `exports.code = Cell.fromHex("${buildArtifact.hex}");\n`,
        );

        const basePath = `./dist/wrappers/${contract}`;
        return {
            types: `${basePath}.d.ts`,
            import: `${basePath}.js`,
        };
    } else {
        const contractConfig = extractContractConfig(config, contract);

        return {
            types: `./dist/${contractConfig.output}/${contract}_${contract}.d.ts`,
            import: `./dist/${contractConfig.output}/${contract}_${contract}.js`,
        };
    }
}

async function correctPackageJson() {
    const contracts = await findContracts();
    const exports: Record<string, { import: string; types: string }> = {};
    for (const contract of contracts) {
        exports[`./${contract}`] = await resolveContract(contract);
    }

    const packageJson = JSON.parse(await fs.readFile(PACKAGE_JSON, 'utf8'));
    const newPackageJson = {
        ...packageJson,
        files: ['dist/**/*'],
        exports,
    };

    await fs.writeFile(PACKAGE_JSON, JSON.stringify(newPackageJson, null, 2));
}

export const pack: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['pack']);
        return;
    }

    ui.write('Building contracts...');
    await buildAll(ui);

    ui.write('Updating tsconfig.json...');
    await correctTsConfig();

    ui.write('Building package...');
    execSync(`tsc`, { stdio: 'inherit' });

    ui.write('Updating package.json...');
    await correctPackageJson();

    ui.write('Package packed successfully and ready to publish.');
};
