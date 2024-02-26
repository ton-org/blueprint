import { oneOrZeroOf, sleep, getExplorerLink } from '../utils';
import arg from 'arg';
import { DeeplinkProvider } from './send/DeeplinkProvider';
import { TonConnectProvider } from './send/TonConnectProvider';
import { TonHubProvider } from './send/TonHubProvider';
import {
    Address,
    Cell,
    comment,
    Contract,
    ContractProvider,
    openContract,
    OpenedContract,
    Sender,
    SenderArguments,
    SendMode,
    toNano,
    TupleItem,
} from '@ton/core';
import { TonClient, TonClient4 } from '@ton/ton';
import { getHttpV4Endpoint } from '@orbs-network/ton-access';
import { UIProvider } from '../ui/UIProvider';
import { NetworkProvider } from './NetworkProvider';
import { SendProvider } from './send/SendProvider';
import { FSStorage } from './storage/FSStorage';
import path from 'path';
import { TEMP_DIR } from '../paths';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { MnemonicProvider, WalletVersion } from './send/MnemonicProvider';
import { Config } from '../config/Config';
import { CustomNetwork } from '../config/CustomNetwork';

export const argSpec = {
    '--mainnet': Boolean,
    '--testnet': Boolean,
    '--custom': String,
    '--custom-type': String,
    '--custom-version': String,
    '--custom-key': String,

    '--tonconnect': Boolean,
    '--deeplink': Boolean,
    '--tonhub': Boolean,
    '--mnemonic': Boolean,

    '--tonscan': Boolean,
    '--tonviewer': Boolean,
    '--toncx': Boolean,
    '--dton': Boolean,
};

export type Args = arg.Result<typeof argSpec>;

type Network = 'mainnet' | 'testnet' | 'custom';

type Explorer = 'tonscan' | 'tonviewer' | 'toncx' | 'dton';

class SendProviderSender implements Sender {
    #provider: SendProvider;
    readonly address?: Address;

    constructor(provider: SendProvider) {
        this.#provider = provider;
        this.address = provider.address();
    }

    async send(args: SenderArguments): Promise<void> {
        if (args.bounce !== undefined) {
            console.warn(
                "Warning: blueprint's Sender does not support `bounce` flag, because it is ignored by all used Sender APIs",
            );
            console.warn('To silence this warning, change your `bounce` flags passed to Senders to unset or undefined');
        }

        if (!(args.sendMode === undefined || args.sendMode === SendMode.PAY_GAS_SEPARATELY)) {
            throw new Error('Deployer sender does not support `sendMode` other than `PAY_GAS_SEPARATELY`');
        }

        await this.#provider.sendTransaction(args.to, args.value, args.body ?? undefined, args.init ?? undefined);
    }
}

class WrappedContractProvider implements ContractProvider {
    #address: Address;
    #provider: ContractProvider;
    #init?: { code?: Cell; data?: Cell };

    constructor(address: Address, provider: ContractProvider, init?: { code?: Cell; data?: Cell }) {
        this.#address = address;
        this.#provider = provider;
        this.#init = init;
    }

    async getState() {
        return await this.#provider.getState();
    }

    async get(name: string, args: TupleItem[]) {
        return await this.#provider.get(name, args);
    }

    async external(message: Cell) {
        return await this.#provider.external(message);
    }

    async internal(
        via: Sender,
        args: {
            value: string | bigint;
            bounce: boolean | undefined | null;
            sendMode?: SendMode;
            body: string | Cell | undefined | null;
        },
    ) {
        const init = this.#init && (await this.getState()).state.type !== 'active' ? this.#init : undefined;

        return await via.send({
            to: this.#address,
            value: typeof args.value === 'string' ? toNano(args.value) : args.value,
            sendMode: args.sendMode,
            bounce: args.bounce,
            init,
            body: typeof args.body === 'string' ? comment(args.body) : args.body,
        });
    }
}

class NetworkProviderImpl implements NetworkProvider {
    #tc: TonClient4 | TonClient;
    #sender: Sender;
    #network: Network;
    #explorer: Explorer;
    #ui: UIProvider;

    constructor(tc: TonClient4 | TonClient, sender: Sender, network: Network, explorer: Explorer, ui: UIProvider) {
        this.#tc = tc;
        this.#sender = sender;
        this.#network = network;
        this.#explorer = explorer;
        this.#ui = ui;
    }

    network(): 'mainnet' | 'testnet' | 'custom' {
        return this.#network;
    }

    explorer(): 'tonscan' | 'tonviewer' | 'toncx' | 'dton' {
        return this.#explorer;
    }

    sender(): Sender {
        return this.#sender;
    }

    api(): TonClient4 | TonClient {
        return this.#tc;
    }

    provider(address: Address, init?: { code?: Cell; data?: Cell }): ContractProvider {
        if (this.#tc instanceof TonClient4) {
            return new WrappedContractProvider(
                address,
                this.#tc.provider(
                    address,
                    init ? { code: init.code ?? new Cell(), data: init.data ?? new Cell() } : undefined,
                ),
                init,
            );
        } else {
            return new WrappedContractProvider(
                address,
                this.#tc.provider(address, { code: init?.code ?? new Cell(), data: init?.data ?? new Cell() }),
                init,
            );
        }
    }

    async isContractDeployed(address: Address): Promise<boolean> {
        if (this.#tc instanceof TonClient4) {
            return this.#tc.isContractDeployed((await this.#tc.getLastBlock()).last.seqno, address);
        } else {
            return (await this.#tc.getContractState(address)).state === 'active';
        }
    }

    async waitForDeploy(address: Address, attempts: number = 10, sleepDuration: number = 2000) {
        if (attempts <= 0) {
            throw new Error('Attempt number must be positive');
        }

        for (let i = 1; i <= attempts; i++) {
            this.#ui.setActionPrompt(`Awaiting contract deployment... [Attempt ${i}/${attempts}]`);
            const isDeployed = await this.isContractDeployed(address);
            if (isDeployed) {
                this.#ui.clearActionPrompt();
                this.#ui.write(`Contract deployed at address ${address.toString()}`);
                this.#ui.write(
                    `You can view it at ${getExplorerLink(address.toString(), this.#network, this.#explorer)}`,
                );
                return;
            }
            await sleep(sleepDuration);
        }

        this.#ui.clearActionPrompt();
        throw new Error("Contract was not deployed. Check your wallet's transactions");
    }

    /**
     * @deprecated
     *
     * Use your Contract's `sendDeploy` method (or similar) together with `waitForDeploy` instead.
     */
    async deploy(contract: Contract, value: bigint, body?: Cell, waitAttempts: number = 10) {
        const isDeployed = await this.isContractDeployed(contract.address);
        if (isDeployed) {
            throw new Error('Contract is already deployed!');
        }

        if (!contract.init) {
            throw new Error('Contract has no init!');
        }

        await this.#sender.send({
            to: contract.address,
            value,
            body,
            init: contract.init,
        });

        if (waitAttempts <= 0) return;

        await this.waitForDeploy(contract.address, waitAttempts);
    }

    open<T extends Contract>(contract: T): OpenedContract<T> {
        return openContract(contract, (params) => this.provider(params.address, params.init ?? undefined));
    }

    ui(): UIProvider {
        return this.#ui;
    }
}

async function createMnemonicProvider(client: TonClient4 | TonClient, ui: UIProvider) {
    const mnemonic = process.env.WALLET_MNEMONIC ?? '';
    const walletVersion = process.env.WALLET_VERSION ?? '';
    if (mnemonic.length === 0 || walletVersion.length === 0) {
        throw new Error(
            'Mnemonic deployer was chosen, but env variables WALLET_MNEMONIC and WALLET_VERSION are not set',
        );
    }
    const keyPair = await mnemonicToPrivateKey(mnemonic.split(' '));
    return new MnemonicProvider({
        version: walletVersion.toLowerCase() as WalletVersion,
        client,
        secretKey: keyPair.secretKey,
        ui,
    });
}

class NetworkProviderBuilder {
    constructor(
        private args: Args,
        private ui: UIProvider,
        private config?: Config,
        private allowCustom = true,
    ) {}

    async chooseNetwork(): Promise<Network> {
        let network = oneOrZeroOf({
            mainnet: this.args['--mainnet'],
            testnet: this.args['--testnet'],
            custom: this.args['--custom'] !== undefined,
        });

        if (network !== undefined) {
            return network;
        }

        if (this.config?.network !== undefined) {
            return typeof this.config.network === 'string' ? this.config.network : 'custom';
        }

        network = await this.ui.choose('Which network do you want to use?', ['mainnet', 'testnet', 'custom'], (c) => c);
        if (network === 'custom') {
            const defaultCustomEndpoint = 'http://localhost:8081/';
            this.args['--custom'] = (
                await this.ui.input(`Provide a custom API v2 endpoint (default is ${defaultCustomEndpoint})`)
            ).trim();
            if (this.args['--custom'] === '') this.args['--custom'] = defaultCustomEndpoint;
        }

        return network;
    }

    chooseExplorer(): Explorer {
        return (
            oneOrZeroOf({
                tonscan: this.args['--tonscan'],
                tonviewer: this.args['--tonviewer'],
                toncx: this.args['--toncx'],
                dton: this.args['--dton'],
            }) ?? 'tonscan'
        );
    }

    async chooseSendProvider(network: Network, client: TonClient4 | TonClient): Promise<SendProvider> {
        let deployUsing = oneOrZeroOf({
            tonconnect: this.args['--tonconnect'],
            deeplink: this.args['--deeplink'],
            tonhub: this.args['--tonhub'],
            mnemonic: this.args['--mnemonic'],
        });

        if (!deployUsing) {
            deployUsing = (
                await this.ui.choose(
                    'Which wallet are you using?',
                    [
                        {
                            name: 'TON Connect compatible mobile wallet (example: Tonkeeper)',
                            value: 'tonconnect',
                        },
                        {
                            name: 'Create a ton:// deep link',
                            value: 'deeplink',
                        },
                        {
                            name: 'Tonhub wallet',
                            value: 'tonhub',
                        },
                        {
                            name: 'Mnemonic',
                            value: 'mnemonic',
                        },
                    ],
                    (c) => c.name,
                )
            ).value as any;
        }

        const storagePath = path.join(TEMP_DIR, network, deployUsing! + '.json');

        let provider: SendProvider;
        switch (deployUsing) {
            case 'deeplink':
                provider = new DeeplinkProvider(this.ui);
                break;
            case 'tonconnect':
                if (network === 'custom') throw new Error('Tonkeeper cannot work with custom network.');
                provider = new TonConnectProvider(new FSStorage(storagePath), this.ui);
                break;
            case 'tonhub':
                if (network === 'custom') throw new Error('TonHub cannot work with custom network.');
                provider = new TonHubProvider(network, new FSStorage(storagePath), this.ui);
                break;
            case 'mnemonic':
                provider = await createMnemonicProvider(client, this.ui);
                break;
            default:
                throw new Error('Unknown deploy option');
        }

        return provider;
    }

    async build(): Promise<NetworkProvider> {
        let network = await this.chooseNetwork();
        const explorer = this.chooseExplorer();

        if (
            network !== 'custom' &&
            (this.args['--custom-key'] !== undefined ||
                this.args['--custom-type'] !== undefined ||
                this.args['--custom-version'] !== undefined)
        ) {
            throw new Error('Cannot use custom parameters with a non-custom network');
        }

        let tc;
        if (network === 'custom') {
            let configNetwork: CustomNetwork | undefined = undefined;
            if (this.config?.network !== undefined && typeof this.config.network !== 'string') {
                configNetwork = this.config.network;
            }
            if (this.args['--custom'] !== undefined) {
                const inputVer = this.args['--custom-version'];
                let version: 'v4' | 'v2' | undefined = undefined;
                if (inputVer !== undefined) {
                    version = inputVer.toLowerCase() as any; // checks come later
                }
                const inputType = this.args['--custom-type'];
                let type: 'mainnet' | 'testnet' | 'custom' | undefined = undefined;
                if (inputType !== undefined) {
                    type = inputType as any; // checks come later
                }
                configNetwork = {
                    endpoint: this.args['--custom'],
                    version,
                    key: this.args['--custom-key'],
                    type,
                };
            }
            if (configNetwork === undefined) {
                throw new Error('Custom network is (somehow) undefined');
            }
            if (configNetwork.version === undefined || configNetwork.version === 'v2') {
                tc = new TonClient({
                    endpoint: configNetwork.endpoint,
                    apiKey: configNetwork.key,
                });
            } else if (configNetwork.version === 'v4') {
                if (configNetwork.key !== undefined) {
                    throw new Error('Cannot use a custom API key with a v4 API');
                }
                tc = new TonClient4({
                    endpoint: configNetwork.endpoint,
                });
            } else {
                throw new Error('Unknown API version: ' + configNetwork.version);
            }

            if (configNetwork.type !== undefined) {
                const ct = configNetwork.type.toLowerCase();
                if (!['mainnet', 'testnet', 'custom'].includes(ct)) {
                    throw new Error('Unknown network type: ' + ct);
                }
                network = ct as Network;
            } else if (!this.allowCustom) {
                throw new Error('The usage of this network provider requires either mainnet or testnet');
            }
        } else {
            tc = new TonClient4({
                endpoint: await getHttpV4Endpoint({ network }),
            });
        }

        const sendProvider = await this.chooseSendProvider(network, tc);

        try {
            await sendProvider.connect();
        } catch (e) {
            console.error('Unable to connect to wallet.');
            process.exit(1);
        } finally {
            this.ui.setActionPrompt('');
        }

        const sender = new SendProviderSender(sendProvider);

        return new NetworkProviderImpl(tc, sender, network, explorer, this.ui);
    }
}

export async function createNetworkProvider(
    ui: UIProvider,
    args: Args,
    config?: Config,
    allowCustom = true,
): Promise<NetworkProvider> {
    return await new NetworkProviderBuilder(args, ui, config, allowCustom).build();
}
