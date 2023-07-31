export type ParamInfo = {
	type: string;
	defaultValue?: string;
	optional?: boolean | null;
	overrideValueWithDefault?: boolean;
};

export type Parameters = Record<string, ParamInfo>;

export type DeployData = {
	canBeCreatedFromConfig: boolean;
	codeHex?: string;
	configType?: Parameters;
};

export type Functions = Record<string, Parameters>;

export type WrapperInfo = {
	sendFunctions: Functions;
	getFunctions: Functions;
	path: string;
	deploy: DeployData;
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

export const loadWrappersFromJSON = async (): Promise<[WrappersData, WrappersConfig]> => {
	const responseWrappers = await fetch('/wrappers.json');
	const responseConfig = await fetch('/config.json');
	const jsonWrappers = await responseWrappers.json();
	const jsonConfig = await responseConfig.json();
	return [jsonWrappers, jsonConfig];
};
