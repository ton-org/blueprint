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
        }

        const cell = result.code;
        ui?.clearActionPrompt();
        ui?.write('\n✅ Compiled successfully! Cell BOC hex result:\n\n');
        ui?.write(cell.toBoc().toString('hex'));

        await fs.mkdir(BUILD_DIR, { recursive: true });

        await fs.writeFile(
            buildArtifactPath,
            JSON.stringify({
                hex: cell.toBoc().toString('hex'),
            })
        );

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
