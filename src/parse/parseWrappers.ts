import fs from 'fs/promises';
import path from 'path';
import { Parameters, parseMethodArguments } from './parseArguments';
import { findWrappers } from '../utils';

export type Functions = Record<string, Parameters>;

export type WrapperInfo = {
    sendFunctions: Functions;
    getFunctions: Functions;
    path: string;
};

export type WrappersData = Record<string, WrapperInfo>;

export type MethodConfig = {
    tabName: string;
    fieldNames: Record<string, string>; // key: param name, value: field name in ui
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

export async function parseWrappersToJSON(wrappersOut = 'wrappers.json', configOut = 'config.json') {
    const files = await findWrappers();
    let wrappers: WrappersData = {};
    let config: WrappersConfig = {};
    for (const { name, path } of files) {
        const wrapperModule = require(path);
        const wrapperClass = wrapperModule[name];
        if (!wrapperClass) continue; // skip this file

        const classProperties = Object.getOwnPropertyNames(wrapperClass);
        if (!classProperties.includes('createFromAddress')) continue; // cannot be created to send tx

        const instanceProperties = Object.getOwnPropertyNames(wrapperClass.prototype);

        const sendMethods = instanceProperties.filter((p) => p.startsWith('send'));
        if (sendMethods.length === 0) continue;
        let skipFile = false;
        const sendFunctions: Functions = {};
        for (const sendMethod of sendMethods) {
            let params = await parseMethodArguments(path, sendMethod);
            if (!params || params.via?.type != 'Sender' || params.provider?.type != 'ContractProvider') continue;
            delete params.via;
            delete params.provider;
            sendFunctions[sendMethod] = params;
        }

        const getMethods = instanceProperties.filter((p) => p.startsWith('get'));
        let getFunctions: Functions = {};
        for (const getMethod of getMethods) {
            let params = await parseMethodArguments(path, getMethod);
            if (!params || params.provider?.type != 'ContractProvider') continue;
            delete params.provider;
            getFunctions[getMethod] = params || {};
        }

        if (skipFile) continue;
        const relativePath = path.replace(process.cwd(), '.');
        wrappers[name] = { sendFunctions, getFunctions, path: relativePath };
        config[name] = {
            defaultAddress: '',
            tabName: '',
            sendFunctions: {},
            getFunctions: {},
        };
        // fill sendFunctions and getFunctions config with '' to all params
        for (const sendMethod of sendMethods) {
            config[name].sendFunctions[sendMethod] = {
                tabName: '',
                fieldNames: {},
            };
            for (const param of Object.keys(sendFunctions[sendMethod])) {
                config[name].sendFunctions[sendMethod].fieldNames[param] = '';
            }
        }
        for (const getMethod of getMethods) {
            config[name].getFunctions[getMethod] = {
                tabName: '',
                fieldNames: {},
                outNames: [],
            };
            for (const param of Object.keys(getFunctions[getMethod])) {
                config[name].getFunctions[getMethod].fieldNames[param] = '';
            }
        }
    }
    await fs.writeFile(wrappersOut, JSON.stringify(wrappers, null, 2));
    updateConfig(configOut, config);
    return wrappers;
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
