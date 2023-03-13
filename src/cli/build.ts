import path from 'path';
import { Args, Runner } from './cli';
import { BUILD_DIR } from '../paths';
import { findCompiles, selectFile } from '../utils';
import fs from 'fs/promises';
import { doCompile, compileResultToCell } from '../compile/compile';
import { UIProvider } from '../ui/UIProvider';

export const build: Runner = async (args: Args, ui: UIProvider) => {
    require('ts-node/register');

    const sel = await selectFile(findCompiles, {
        ui,
        hint: args._.length > 1 && args._[1].length > 0 ? args._[1] : undefined,
        import: false,
    });

    const contract = sel.name;

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
};
