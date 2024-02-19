import { Args, Runner } from './Runner';
import { UIProvider } from '../ui/UIProvider';
import { readFile, writeFile } from 'fs/promises';
import { exec } from 'node:child_process';
import path from 'path';
import arg from 'arg';

const getVersions = (my_package: string, ui: UIProvider) : Promise<string[]> => {
    return new Promise((resolve, reject) => {
        exec(`npm view ${my_package} versions --json`, (error, stdout, stderr) => {
            if(stderr) {
                ui.write(stderr);
            }
            if(stdout) {
                if(error == null) {
                    try {
                        const resJson = JSON.parse(stdout);
                        if(Array.isArray(resJson)) {
                            resolve(resJson);
                        }
                        else {
                            throw new TypeError("Expect json array on stdout, but got:" + stdout);
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                }
                else {
                    ui.write(stdout);
                }
            }
            if(error) {
                ui.write("Failed to get func-js-bin package versions!");
                reject(error);
            }
        });
    });
};

const install = (ui: UIProvider) : Promise<void> => {
    return new Promise((resolve, reject) => {
        exec('npm i', (error, stdout, stderr) => {
                if(stderr) {
                    ui.write(stderr);
                }
                if(stdout) {
                    ui.write(stdout);
                }
                if(error) {
                    reject(error);
                }
                resolve();
        });
    });
}

export const custom: Runner = async (args: Args, ui: UIProvider) => {

    let   packageUpd = false;
    const localArgs  = arg({
        '--func': String,
    });

    let funcVersions    = await getVersions('@ton-community/func-js-bin', ui);
    const customFunc    = localArgs['--func'] ?? await ui.choose('Choose FunC version:', funcVersions, (s) => s);
    const packagePath   = path.join(process.cwd(),"package.json")

    const currentPackage = JSON.parse(await readFile(packagePath, {encoding: "utf8"}));
    const newPackage     = JSON.parse(JSON.stringify(currentPackage)); // Clone
    let   overrides = newPackage.overrides;

    if(customFunc) { // Redundant if for now
        if(customFunc == '?') {
            ui.write(`Available FunC versions:${funcVersions.join("\n")}`);
        }
        else if(funcVersions.includes(customFunc)) {
            overrides = {
                ...overrides,
                "@ton-community/func-js-bin": customFunc
            };
            packageUpd = true;
        }
        else {
            throw(new Error(`Version ${customFunc} is not available!\n\n${funcVersions.join("\n")}`));
        }
    }
    // else if Other flags related to binar packages.(emulator?)

    if(packageUpd) {
        newPackage.overrides = overrides;
        ui.write("Updating package.json...");
        await writeFile(packagePath, JSON.stringify(newPackage, null, 2), {encoding: "utf8"});
        try { 
            await install(ui);
        }
        catch(e) {
            ui.write("Failed to update FunC version!\n\n");
            ui.write("Rolling back package.json...\n\n");
            await writeFile(packagePath, JSON.stringify(currentPackage, null, 2), {encoding: "utf8"});
            throw(e);
        }
    }
};
