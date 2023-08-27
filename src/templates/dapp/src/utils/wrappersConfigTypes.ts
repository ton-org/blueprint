export type ParamInfo = {
	type: string;
	defaultValue?: string;
	optional?: boolean | null;
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
