import fs from 'fs/promises';
import { WrapperInfo, parseWrapper } from './parseWrapper';
import { findWrappers } from '../utils';
import { UIProvider } from '../ui/UIProvider';

export type WrappersData = Record<string, WrapperInfo>;

export type ParamConfig = {
    fieldTitle: string;
    overrideWithDefault?: boolean;
};

export type ParamsConfig = Record<string, ParamConfig>;

export type MethodConfig = {
    tabName: string;
    params: ParamsConfig;
};

export type GetMethodConfig = MethodConfig & {
    outNames: string[];
};

export type WrapperConfig = {
    defaultAddress: string;
    tabName: string;
    sendFunctions: Record<string, MethodConfig>;
    getFunctions: Record<string, GetMethodConfig>;
};

export type WrappersConfig = Record<string, WrapperConfig>;

export async function parseWrappersToJSON(ui: UIProvider, wrappersOut = 'wrappers.json', configOut = 'config.json') {
    const files = await findWrappers();
    let wrappers: WrappersData = {};
    let config: WrappersConfig = {};
    for (const { name, path } of files) {
        const wrapperModule = require(path);
        const wrapperClass = wrapperModule[name];
        if (!wrapperClass) continue; // skip this file

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
        // fill sendFunctions and getFunctions config with '' to all params
        for (const sendMethod of Object.keys(wrapper.sendFunctions)) {
            config[name].sendFunctions[sendMethod] = {
                tabName: '',
                params: {},
            };
            for (const [paramName, paramData] of Object.entries(wrapper.sendFunctions[sendMethod])) {
                config[name].sendFunctions[sendMethod].params[paramName] = {
                    fieldTitle: '',
                    // add to config an option to hide input if default value is present
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
    await fs.writeFile(wrappersOut, JSON.stringify(wrappers, null, 2));
    updateConfig(configOut, config);
    return files.map((f) => f.path);
}

// Custom merge function for objects
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
// Function to update the configuration
const updateConfig = async (configPath: string, newConfig: WrappersConfig) => {
    // Load the current config.json file
    let config: WrappersConfig = {};
    try {
        const configFile = await fs.readFile(configPath, 'utf-8');
        config = JSON.parse(configFile);
    } catch (e) {}

    // Update the configuration
    for (const key in newConfig) {
        if (newConfig.hasOwnProperty(key)) {
            const existingWrapper = config[key];
            const newWrapper = newConfig[key];

            // If the record already exists, merge the values preserving the existing values
            if (existingWrapper) {
                const mergedWrapper: WrapperConfig = {
                    defaultAddress: existingWrapper.defaultAddress || newWrapper.defaultAddress,
                    tabName: existingWrapper.tabName || newWrapper.tabName,
                    sendFunctions: mergeObjects(existingWrapper.sendFunctions, newWrapper.sendFunctions),
                    getFunctions: mergeObjects(existingWrapper.getFunctions, newWrapper.getFunctions),
                };
                config[key] = mergedWrapper;
            } else {
                // If the record doesn't exist, add a new record
                config[key] = newWrapper;
            }
        }
    }

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
};
