import { CHAIN, TonConnect } from '@tonconnect/sdk';
import { TonClient } from 'ton';
import { Address, beginCell, Sender, SenderArguments, SendMode, storeStateInit } from 'ton-core';
import { ParamsWithValue } from './components/ActionCard/ActionCard';
import { connector } from './connector';

class SendProviderSender implements Sender {
	#provider: TonConnect;
	readonly address?: Address;

	constructor(provider: TonConnect) {
		this.#provider = provider;
		if (provider.wallet) this.address = Address.parse(provider.wallet?.account.address);
		else this.address = undefined;
	}

	async send(args: SenderArguments): Promise<void> {
		if (args.bounce !== undefined) {
			console.warn(
				"Warning: blueprint's Sender does not support `bounce` flag, because it is ignored by all used Sender APIs",
			);
			console.warn('To silence this warning, change your `bounce` flags passed to Senders to unset or undefined');
		}

		if (!(args.sendMode === undefined || args.sendMode == SendMode.PAY_GAS_SEPARATELY)) {
			throw new Error('Deployer sender does not support `sendMode` other than `PAY_GAS_SEPARATELY`');
		}

		await this.#provider.sendTransaction({
			validUntil: Date.now() + 5 * 60 * 1000,
			messages: [
				{
					address: args.to.toString(),
					amount: args.value.toString(),
					payload: args.body?.toBoc().toString('base64'),
					stateInit: args.init
						? beginCell().storeWritable(storeStateInit(args.init)).endCell().toBoc().toString('base64')
						: undefined,
				},
			],
		});
	}
}

export async function executeSend(
	contractAddr: Address,
	wrapperPath: string,
	className: string,
	methodName: string,
	params: ParamsWithValue,
) {
	const testnet = connector.wallet?.account.chain === CHAIN.TESTNET;
	const endpoint = `https://${testnet ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`;
	const client = new TonClient({ endpoint });
	const Wrapper = require(`${wrapperPath}`)[className];
	const contractProvider = client.open(Wrapper.createFromAddress(contractAddr));
	const args = Object.values(params).map((param) => param.value);
	const via = new SendProviderSender(connector);
	return await contractProvider[methodName](via, ...args);
}

export async function executeGet(
	contractAddr: Address,
	wrapperPath: string,
	className: string,
	methodName: string,
	params: ParamsWithValue,
) {
	const testnet = connector.wallet?.account.chain === CHAIN.TESTNET;
	const endpoint = `https://${testnet ? 'testnet.' : ''}toncenter.com/api/v2/jsonRPC`;
	const client = new TonClient({ endpoint });
	const Wrapper = require(`${wrapperPath}`)[className];
	const contractProvider = client.open(Wrapper.createFromAddress(contractAddr));
	const args = Object.values(params).map((param) => param.value);

	return await contractProvider[methodName](...args);
}
