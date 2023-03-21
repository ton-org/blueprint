import path from 'path';
import { Args, Runner } from './cli';
import { BUILD_DIR } from '../paths';
import { findCompiles, selectFile } from '../utils';
import fs from 'fs/promises';
import { doCompile, compileResultToCell } from '../compile/compile';
import { UIProvider } from '../ui/UIProvider';
import arg from 'arg';

async function buildOne(contract: string, ui: UIProvider) {
    ui.write(`Build script running, compiling ${contract}`);

    const buildArtifactPath = path.join(BUILD_DIR, `${contract}.compiled.json`);

    try {
        await fs.unlink(buildArtifactPath);
    } catch (e) {}

    ui.setActionPrompt('⏳ Compiling...');
    try {
        const result = await doCompile(contract);

        if (result.lang === 'tact') {
            for (const [k, v] of result.result) {
                await fs.mkdir(path.dirname(k), {
                    recursive: true,
                });
                await fs.writeFile(k, v);
            }
        }

        const cell = await compileResultToCell(result);
        ui.clearActionPrompt();
        ui.write('\n✅ Compiled successfully! Cell BOC hex result:\n\n');
        ui.write(cell.toBoc().toString('hex'));

        await fs.mkdir(BUILD_DIR, { recursive: true });

        await fs.writeFile(
            buildArtifactPath,
            JSON.stringify({
                hex: cell.toBoc().toString('hex'),
            })
        );

        ui.write(`\n✅ Wrote compilation artifact to ${path.relative(process.cwd(), buildArtifactPath)}`);
    } catch (e) {
        ui.clearActionPrompt();
        ui.write((e as any).toString());
        process.exit(1);
    }
}

export const build: Runner = async (args: Args, ui: UIProvider) => {
    require('ts-node/register');

    const localArgs = arg({
        '--all': Boolean,
    });

    const files = await findCompiles();

    if (localArgs['--all']) {
        for (const file of files) {
            await buildOne(file.name, ui);
        }
    } else {
        const sel = await selectFile(files, {
            ui,
            hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
            import: false,
        });

        await buildOne(sel.name, ui);
    }
};
