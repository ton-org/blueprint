import fs from 'fs/promises';
import { parseWrapper } from './parseWrapper';
import { findWrappers } from '../utils';
import { UIProvider } from '../ui/UIProvider';
import {
    WrapperInfo,
    WrappersData,
    WrapperConfig,
    WrappersConfig,
} from '../templates/dapp/src/utils/wrappersConfigTypes';

// Custom merge function for objects, for soft updates
const mergeObjects = (target: any, source: any) => {
    const mergedObj = { ...target };
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            if (mergedObj[key] && typeof mergedObj[key] === 'object' && typeof source[key] === 'object') {
                mergedObj[key] = mergeObjects(mergedObj[key], source[key]);
            } else if (mergedObj[key] === undefined) {
                mergedObj[key] = source[key];
            }
        }
    }
    return mergedObj;
};

async function mergeConfigs(configDest: WrappersConfig, configFrom: WrappersConfig) {
    // Update the configuration
    for (const key in configFrom) {
        if (configFrom.hasOwnProperty(key)) {
            const existingWrapper = configDest[key];
            const newWrapper = configFrom[key];

            // If the record already exists, merge the values preserving the existing values
            if (existingWrapper) {
                const mergedWrapper: WrapperConfig = {
                    defaultAddress: existingWrapper.defaultAddress || newWrapper.defaultAddress,
                    tabName: existingWrapper.tabName || newWrapper.tabName,
                    sendFunctions: mergeObjects(existingWrapper.sendFunctions, newWrapper.sendFunctions),
                    getFunctions: mergeObjects(existingWrapper.getFunctions, newWrapper.getFunctions),
                };
                configDest[key] = mergedWrapper;
            } else {
                // If the record doesn't exist, add a new record
                configDest[key] = newWrapper;
            }
        }
    }
    return configDest;
}

async function writeUpdateConfig(configPath: string, newConfig: WrappersConfig) {
    let config: WrappersConfig = {}; // empty by default
    try {
        // Load the current config.json file
        const configFile = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configFile);
    } catch (e) {}

    // Merge the new config with the existing config
    config = await mergeConfigs(config, newConfig);

    // Write the modified config back to the file
    await fs.writeFile(
        configPath,
        JSON.stringify(
            config,
            (_, value) => {
                if (Array.isArray(value) && value.length === 0) {
                    return []; // Replace empty arrays with []
                }
                return value;
            },
            2
        )
    );
}

type File = { path: string; name: string };
async function parseFromFiles(ui: UIProvider, files: File[]) {
    let wrappers: WrappersData = {};
    let config: WrappersConfig = {};
    for (const { name, path } of files) {
        const wrapperModule = require(path);
        const wrapperClass = wrapperModule[name];
        if (!wrapperClass) continue; // no main class - skip

        let wrapper: WrapperInfo;
        try {
            wrapper = await parseWrapper(path, name);
        } catch (e) {
            if (e instanceof Error) {
                ui.write('⚠️ Omitting `' + name + '`: ' + e.message);
            }
            continue;
        }
        wrappers[name] = wrapper;

        config[name] = {
            defaultAddress: '',
            tabName: '',
            sendFunctions: {},
            getFunctions: {},
        };
        // Fill sendFunctions and getFunctions config with '' to all params
        for (const sendMethod of Object.keys(wrapper.sendFunctions)) {
            config[name].sendFunctions[sendMethod] = {
                tabName: '',
                params: {},
            };
            for (const [paramName, paramData] of Object.entries(wrapper.sendFunctions[sendMethod])) {
                config[name].sendFunctions[sendMethod].params[paramName] = {
                    fieldTitle: '',
                    // Add to config an option to hide input if default value is present
                    overrideWithDefault: paramData.defaultValue || paramData.optional ? false : undefined,
                };
            }
        }
        for (const getMethod of Object.keys(wrapper.getFunctions)) {
            config[name].getFunctions[getMethod] = {
                tabName: '',
                params: {},
                outNames: [],
            };
            for (const [paramName, paramData] of Object.entries(wrapper.getFunctions[getMethod])) {
                config[name].getFunctions[getMethod].params[paramName] = {
                    fieldTitle: '',
                    overrideWithDefault: paramData.defaultValue || paramData.optional ? false : undefined,
                };
            }
        }
    }
    return { wrappers, config, paths: files.map((f) => f.path) };
}

export async function parseWrappersToJSON(ui: UIProvider, wrappersOut = 'wrappers.json', configOut = 'config.json') {
    const files = await findWrappers();
    const { wrappers, config, paths } = await parseFromFiles(ui, files);

    // Write JSONs
    await fs.writeFile(wrappersOut, JSON.stringify(wrappers, null, 2));
    writeUpdateConfig(configOut, config);
    return paths;
}
