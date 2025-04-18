import path from 'path';
import fs from 'fs/promises';
import { doCompile } from './compile/compile';
import { BUILD_DIR } from './paths';
import { UIProvider } from './ui/UIProvider';
import { findCompiles } from './utils';

export async function buildOne(contract: string, ui?: UIProvider) {
    ui?.write(`Build script running, compiling ${contract}`);

    const buildArtifactPath = path.join(BUILD_DIR, `${contract}.compiled.json`);

    try {
        await fs.unlink(buildArtifactPath);
    } catch (e) {}

    ui?.setActionPrompt('⏳ Compiling...');
    try {
        const result = await doCompile(contract);

        if (result.lang === 'tact') {
            for (const [k, v] of result.fs) {
                await fs.mkdir(path.dirname(k), {
                    recursive: true,
                });
                await fs.writeFile(k, v);
            }

            if (result.options !== undefined && result.options?.debug === true) {
                ui?.clearActionPrompt();
                ui?.write(
                    '\n⚠️ Make sure to disable debug mode in contract wrappers before doing production deployments!',
                );
            }
        }

        const cell = result.code;
        const rHash = cell.hash();
        const res = {
            hash: rHash.toString('hex'),
            hashBase64: rHash.toString('base64'),
            hex: cell.toBoc().toString('hex'),
        };
        ui?.clearActionPrompt();
        if (result.lang === 'tolk') {
            ui?.write(`\n${result.stderr}`);
        }
        ui?.write('\n✅ Compiled successfully! Cell BOC result:\n\n');
        ui?.write(JSON.stringify(res, null, 2));

        await fs.mkdir(BUILD_DIR, { recursive: true });

        await fs.writeFile(buildArtifactPath, JSON.stringify(res));

        ui?.write(`\n✅ Wrote compilation artifact to ${path.relative(process.cwd(), buildArtifactPath)}`);
    } catch (e) {
        if (ui) {
            ui?.clearActionPrompt();
            ui?.write((e as any).toString());
            process.exit(1);
        } else {
            throw e;
        }
    }
}

export async function buildAll(ui?: UIProvider) {
    for (const file of await findCompiles()) {
        await buildOne(file.name, ui);
    }
}
