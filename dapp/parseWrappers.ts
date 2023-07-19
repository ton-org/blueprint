import { compile } from '@ton-community/blueprint';
import fs from 'fs';
import path from 'path';
import { Cell } from 'ton-core';
import { Parameters, parseMethodArguments } from './parseArguments';

export const WRAPPERS_DIR = path.join(process.cwd(), 'wrappers');

export const findWrappers = () =>
	fs
		.readdirSync(WRAPPERS_DIR)
		.filter((f) => f.match(/^[A-Z][a-zA-Z0-9]*\.ts$/))
		.map((f) => ({ path: path.join(WRAPPERS_DIR, f), name: path.parse(f).name }));

export type Functions = Record<string, Parameters>;

export type WrapperInfo = {
	sendFunctions: Functions;
	getFunctions: Functions;
	path: string;
	canBeCreatedFromConfig?: boolean;
	codeHex?: string;
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
	const files = findWrappers();
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
			let params = parseMethodArguments(path, sendMethod);
			if (!params || params.via?.type != 'Sender' || params.provider?.type != 'ContractProvider') continue;
			delete params.via;
			delete params.provider;
			sendFunctions[sendMethod] = params;
		}

		const getMethods = instanceProperties.filter((p) => p.startsWith('get'));
		let getFunctions: Functions = {};
		for (const getMethod of getMethods) {
			let params = parseMethodArguments(path, getMethod);
			if (!params || params.provider?.type != 'ContractProvider') continue;
			delete params.provider;
			getFunctions[getMethod] = params || {};
		}

		let canBeCreatedFromConfig = classProperties.includes('createFromConfig');
		let codeHex = undefined;
		if (canBeCreatedFromConfig) {
			try {
				if (!fs.existsSync(path.replace('.ts', '.compile.ts'))) throw new Error('Wrapper cannot be compiled at all');
				const compiled = fs.readFileSync(path.replace('wrappers', 'build').replace('.ts', '.compiled.json'), 'utf-8');
				codeHex = JSON.parse(compiled).hex;
			} catch (e) {
				canBeCreatedFromConfig = false;
			}
		}

		if (skipFile) continue;
		const relativePath = path.replace(process.cwd(), '.');
		wrappers[name] = { sendFunctions, getFunctions, path: relativePath, canBeCreatedFromConfig, codeHex };
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
	fs.writeFileSync(path.join(process.cwd(), wrappersOut), JSON.stringify(wrappers, null, 2));
	updateConfig(path.join(process.cwd(), configOut), config);
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
const updateConfig = (configPath: string, newConfig: WrappersConfig) => {
	// Load the current config.json file
	let config: WrappersConfig = {};
	try {
		const configFile = fs.readFileSync(configPath, 'utf-8');
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
	fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
};
