import { Args, Runner, RunnerContext } from './Runner';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';
import { buildAll } from '../build';
import { promises as fs, existsSync } from 'fs';
import {BUILD_DIR, PACKAGE, PACKAGE_DIR, PACKAGE_JSON, TYPESCRIPT_CONFIG} from '../paths';
import { execSync } from 'child_process';
import path from 'path';
import { findContracts } from '../utils';
import { getCompilerConfigForContract } from '../compile/compile';
import { isCompilableConfig } from '../compile/CompilerConfig';
import { extractContractConfig } from '../compile/tact/compile.tact';

export async function extractBuildDirectoryFromConfig(): Promise<string> {
    if (!existsSync(TYPESCRIPT_CONFIG)) {
        throw new Error('TypeScript config does not exist. Ensure the command runs in the correct environment.');
    }

    const tsConfigContent = await fs.readFile(TYPESCRIPT_CONFIG, 'utf-8');

    let tsConfig;
    try {
        tsConfig = JSON.parse(tsConfigContent);
    } catch {
        throw new Error('TypeScript config is not a valid JSON.');
    }

    const compilerOptions = tsConfig?.compilerOptions;
    const outDir = compilerOptions?.outDir;

    if (typeof outDir !== 'string') {
        throw new Error(`Missing or invalid 'compilerOptions.outDir' in TypeScript config.`);
    }

    return outDir;
}

const tsConfigForPackage = {
    "compilerOptions": {
        "target": "ES2020",
        "outDir": "dist",
        "rootDir": "src",
        "module": "commonjs",
        "declaration": true,
        "esModuleInterop": true,
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "skipLibCheck": true,
        "allowJs": true
    }
}

async function addContractFile(packageRootDir: string, contract: string) {
    const filePath = path.join(packageRootDir, `${contract}.ts`);

    const config = await getCompilerConfigForContract(contract);
    if (isCompilableConfig(config)) {
        await fs.writeFile(filePath, `export * from "./parent/wrappers/${contract}"\n`);
    } else {
        const contractConfig = extractContractConfig(config, contract);
        await fs.writeFile(filePath, `export * from "./parent/${contractConfig.output}/${contract}_${contract}"\n`);
    }

    const buildArtifactPath = path.join(BUILD_DIR, `${contract}.compiled.json`);
    const buildArtifact = await fs.readFile(buildArtifactPath, 'utf8');
    await fs.appendFile(filePath, `export const code = ${buildArtifact}\n`);
}

export const pack: Runner = async (args: Args, ui: UIProvider, context: RunnerContext) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['pack']);
        return;
    }

    ui.write('Building contracts...');
    await buildAll(ui);

    ui.write('Building parent package...');
    await fs.rm(PACKAGE_DIR, { recursive: true, force: true });
    execSync(`tsc`, { stdio: 'inherit' });

    ui.write('Creating package directory...');
    const tsBuildDirectory = await extractBuildDirectoryFromConfig();
    const packageRootDir = path.join(PACKAGE_DIR, 'src');
    const parentDir = path.join(packageRootDir, 'parent');
    await fs.cp(tsBuildDirectory, parentDir, { recursive: true });

    const contracts = await findContracts();
    for (const contract of contracts) {
        await addContractFile(packageRootDir, contract);
    }

    ui.write('Building inner package...');
    await fs.writeFile(path.join(PACKAGE_DIR, 'tsconfig.json'), JSON.stringify(tsConfigForPackage, null, 2));
    execSync(`cd package && tsc`, { stdio: 'inherit' });

    const packageJson = JSON.parse(await fs.readFile(PACKAGE_JSON, 'utf8'));
    const newPackageJson = {
        dependencies: packageJson.devDependencies,
        files: ["dist/**/*"],
        ...packageJson,
    }

    await fs.writeFile(path.join(PACKAGE_DIR, 'package.json'), JSON.stringify(newPackageJson, null, 2));
};

