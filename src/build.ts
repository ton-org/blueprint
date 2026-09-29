import path from 'path';
import fs from 'fs/promises';

import { doCompile, getCompilerConfigForContract, getCompilerOptions, libraryCellFromCode } from './compile/compile';
import { BUILD_DIR } from './paths';
import { UIProvider } from './ui/UIProvider';
import { findContracts } from './utils';

export async function buildOne(contract: string, ui?: UIProvider) {
    ui?.write(`Build script running, compiling ${contract}`);

    const buildArtifactPath = path.join(BUILD_DIR, `${contract}.compiled.json`);

    try {
        await fs.unlink(buildArtifactPath);
        // eslint-disable-next-line no-empty
    } catch (_) {}

    ui?.setActionPrompt('⏳ Compiling...');
    try {
        const config = await getCompilerConfigForContract(contract);
        const compilerOptions = await getCompilerOptions(config);
        ui?.write(`🔧 Using ${compilerOptions.lang} version ${compilerOptions.version}...`);

        // Build raw code cell by default
        const result = await doCompile(contract, { buildLibrary: false });

        let libAttributes:
            | {
                  libraryHash: string;
                  libraryBoc: string;
              }
            | undefined;

        const cell = result.code;

        // If build was configured as library, add attributes
        if (config.buildLibrary === true) {
            const libCell = libraryCellFromCode(cell);
            libAttributes = {
                libraryHash: libCell.hash().toString('hex'),
                libraryBoc: libCell.toBoc().toString('hex'),
            };
        }

        const rHash = cell.hash();
        const res = {
            hash: rHash.toString('hex'),
            hashBase64: rHash.toString('base64'),
            hex: cell.toBoc().toString('hex'),
            ...libAttributes,
        };
        ui?.clearActionPrompt();
        ui?.write('\n✅ Compiled successfully! Cell BOC result:\n\n');
        ui?.write(JSON.stringify(res, null, 2));

        await fs.mkdir(BUILD_DIR, { recursive: true });

        await fs.writeFile(buildArtifactPath, JSON.stringify(res));
        const fiftFilepath = path.join(BUILD_DIR, contract, `${contract}.fif`);
        await fs.mkdir(path.join(BUILD_DIR, contract), { recursive: true });
        await fs.writeFile(fiftFilepath, result.fiftCode);

        ui?.write(`\n✅ Wrote compilation artifact to ${path.relative(process.cwd(), buildArtifactPath)}`);
    } catch (e) {
        if (ui) {
            ui?.clearActionPrompt();
            ui?.write((e as Error).toString());
            process.exit(1);
        } else {
            throw e;
        }
    }
}

async function buildContracts(contracts: string[], ui?: UIProvider) {
    for (const contract of contracts) {
        await buildOne(contract, ui);
    }
}

export async function buildAll(ui?: UIProvider) {
    await buildContracts(await findContracts(), ui);
}
