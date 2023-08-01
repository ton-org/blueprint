import { WrappersConfig, WrappersData } from './wrappersConfigTypes';

export const loadWrappersFromJSON = async (): Promise<[WrappersData, WrappersConfig]> => {
	const responseWrappers = await fetch('/wrappers.json');
	const responseConfig = await fetch('/config.json');
	const jsonWrappers = await responseWrappers.json();
	const jsonConfig = await responseConfig.json();
	return [jsonWrappers, jsonConfig];
};
