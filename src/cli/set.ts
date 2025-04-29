import { Args, Runner } from './Runner';
import { UIProvider } from '../ui/UIProvider';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'node:child_process';
import path from 'path';
import arg from 'arg';
import { helpArgs, helpMessages } from './constants';
import * as pkgManagerService from '../pkgManager/service';

const getVersions = async (pkg: string, ui: UIProvider): Promise<string[]> => {
    const result = pkgManagerService.runCommand('view', [pkg, 'versions', '--json'], {
        stdio: 'pipe',
        shell: false,
    });

    if (result.status !== 0 || !result.stdout) {
        const errorMsg = result.stderr?.toString() || `Failed to get versions for ${pkg}`;
        ui.write(errorMsg);
        throw new Error(`Failed to get versions for ${pkg}. Exit code: ${result.status}`);
    }

    const stdout = result.stdout.toString();

    try {
        const resJson = JSON.parse(stdout);
        if (Array.isArray(resJson)) {
            return resJson;
        } else {
            throw new TypeError("Expected JSON array from view command, but got:\n" + stdout);
        }
    } catch (e) {
        ui.write("Failed to parse versions JSON:" + stdout);
        throw e;
    }
};

const install = (cmd: string, ui: UIProvider): Promise<void> => {
    return new Promise((resolve, reject) => {
        exec(cmd, { cwd: process.cwd() }, (error, stdout, stderr) => {
                if (stderr) {
                    ui.write(stderr);
                }
                if (stdout) {
                    ui.write(stdout);
                }
                if (error) {
                    reject(error);
                    return;
                }
                resolve();
        });
    });
}

export const set: Runner = async (args: Args, ui: UIProvider) => {
    const localArgs = arg(helpArgs);
    if (localArgs['--help']) {
        ui.write(helpMessages['set']);
        return;
    }

    if (args._.length < 2) {
        throw new Error('Please pass a key');
    }

    switch (args._[1]) {
        case 'func': {
            const pkg = '@ton-community/func-js-bin';

            const funcVersions = await getVersions(pkg, ui);

            let version = args._.length > 2 ? args._[2] : '';
            if (!funcVersions.includes(version)) {
                version = await ui.choose('Choose FunC version', funcVersions, (s) => s);
            }

            const packagePath = path.join(process.cwd(), 'package.json');
            const packageContents = (await readFile(packagePath)).toString('utf-8');
            const parsedPackage = JSON.parse(packageContents);

            const packageManager = pkgManagerService.detectPackageManager();

            const overrideKey = pkgManagerService.getOverrideKey();

            parsedPackage[overrideKey] = {
                ...parsedPackage[overrideKey],
                [pkg]: version,
            };

            ui.write('Updating package.json...');

            await writeFile(packagePath, JSON.stringify(parsedPackage, null, 4));

            let installCmdString: string;
            switch(packageManager) {
                case 'yarn': installCmdString = 'yarn install'; break;
                case 'pnpm': installCmdString = 'pnpm install'; break;
                case 'bun': installCmdString = 'bun install'; break;
                default: installCmdString = 'npm install'; break;
            }

            try {
                ui.write('Installing dependencies...');
                await install(installCmdString, ui);
            } catch (e) {
                ui.write('Failed to install dependencies, rolling back package.json');
                await writeFile(packagePath, packageContents);
                throw e;
            }

            break;
        }
        default: {
            throw new Error('Unknown key: ' + args._[1]);
        }
    }
};
