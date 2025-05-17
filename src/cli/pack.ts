import { execSync } from 'child_process';
import path from 'path';
import arg from 'arg';
import { promises as fs, existsSync } from 'fs';

import { Args, Runner, RunnerContext } from './Runner';
import { UIProvider } from '../ui/UIProvider';
import { helpArgs, helpMessages } from './constants';
import { buildAll } from '../build';
import { BUILD_DIR, PACKAGE_ENTRY_POINT, PACKAGE_JSON, TYPESCRIPT_CONFIG } from '../paths';
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
            declaration: true,
            esModuleInterop: true,
        },
        include: distinct([...(tsConfig.include ?? []), 'package.ts']),
    };

    await fs.writeFile(TYPESCRIPT_CONFIG, JSON.stringify(newConfig, null, 2), 'utf8');
}

async function getContractWrapperPath(contract: string) {
    const config = await getCompilerConfigForContract(contract);
    if (isCompilableConfig(config)) {
        return `./wrappers/${contract}`;
    } else {
        const contractConfig = extractContractConfig(config, contract);
        return `./${contractConfig.output}/${contract}_${contract}`;
    }
}

async function generatePackageEntryPoint() {
    const contracts = await findContracts();

    let entryPoint = 'import { Cell } from "@ton/core"\n';

    for (const contract of contracts) {
        const wrapperPath = await getContractWrapperPath(contract);

        entryPoint += `import * as ${contract} from '${wrapperPath}';\n`;
        entryPoint += `export { ${contract} };\n`;

        const buildArtifactPath = path.join(BUILD_DIR, `${contract}.compiled.json`);
        const buildArtifact = JSON.parse(await fs.readFile(buildArtifactPath, 'utf8'));
        entryPoint += `export const ${contract}Code = Cell.fromHex("${buildArtifact.hex}");\n`;
    }

    await fs.writeFile(PACKAGE_ENTRY_POINT, entryPoint, 'utf8');
}

async function correctPackageJson() {
    const packageJson = JSON.parse(await fs.readFile(PACKAGE_JSON, 'utf8'));
    const newPackageJson = {
        ...packageJson,
        main: 'dist/package.js',
        files: ['dist/**/*'],
    };

    await fs.writeFile(PACKAGE_JSON, JSON.stringify(newPackageJson, null, 2));
}

export const pack: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['pack']);
        return;
    }

    ui.write('🔨 Building contracts... Please wait...');
    await buildAll(ui);

    ui.write('📦 Generating package entry point...');
    await generatePackageEntryPoint();

    ui.write('🛠️ Updating tsconfig.json...');
    await correctTsConfig();

    ui.write('🏗️ Building package...');
    await fs.rm(path.join(process.cwd(), 'dist'), { recursive: true, force: true });
    execSync(`tsc`, { stdio: 'inherit' });

    ui.write('📝 Updating package.json...');
    await correctPackageJson();

    ui.write('🎉 Package is ready and packed successfully! You can now publish it 🚀');
};
