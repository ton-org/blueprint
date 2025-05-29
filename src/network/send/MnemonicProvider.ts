import {
    Address,
    Cell,
    Contract,
    ContractProvider,
    MessageRelaxed,
    openContract,
    OpenedContract,
    SendMode,
    StateInit,
} from '@ton/core';
import { SendProvider } from './SendProvider';
import { KeyPair, keyPairFromSecretKey } from '@ton/crypto';
import { UIProvider } from '../../ui/UIProvider';
import { BlueprintTonClient } from '../NetworkProvider';
import { Network } from '../Network';
import { Buffer } from 'buffer';
import {wallets, WalletVersion} from './wallets';

interface WalletInstance extends Contract {
    getSeqno(provider: ContractProvider): Promise<number>;

    sendTransfer(
        provider: ContractProvider,
        args: {
            seqno: number;
            secretKey: Buffer;
            messages: MessageRelaxed[];
            sendMode: SendMode;
            timeout?: number;
        },
    ): Promise<void>;
}

type MnemonicProviderParams = {
    version: WalletVersion;
    workchain?: number;
    walletId?: number;
    subwalletNumber?: number;
    secretKey: Buffer;
    client: BlueprintTonClient;
    ui: UIProvider;
    network: Network;
};

export class MnemonicProvider implements SendProvider {
    #wallet: OpenedContract<WalletInstance>;
    #secretKey: Buffer;
    #client: BlueprintTonClient;
    #ui: UIProvider;
    #network: Network;

    constructor(params: MnemonicProviderParams) {
        if (!(params.version in wallets)) {
            throw new Error(`Unknown wallet version ${params.version}, expected one of ${Object.keys(wallets).join(', ')}`);
        }
        this.#client = params.client;
        this.#network = params.network;
        const kp = keyPairFromSecretKey(params.secretKey);

        this.#wallet = openContract<WalletInstance>(this.createWallet(params, kp), (params) =>
            this.#client.provider(
                params.address,
                params.init && {
                    ...params.init,
                    data: params.init.data ?? undefined,
                    code: params.init.code ?? undefined,
                },
            ),
        );
        this.#secretKey = kp.secretKey;
        this.#ui = params.ui;
    }

    private createWallet(params: MnemonicProviderParams, kp: KeyPair): WalletInstance {
        if (params.version === 'v5r1') {
            return wallets[params.version].create({
                publicKey: kp.publicKey,
                walletId: {
                    networkGlobalId: params.network === 'testnet' ? -3 : -239, // networkGlobalId: -3 for Testnet, -239 for Mainnet
                    context: {
                        workchain: params.workchain ?? 0,
                        subwalletNumber: params.subwalletNumber ?? 0,
                        walletVersion: 'v5r1',
                    },
                },
            });
        }

        return wallets[params.version].create({
            workchain: params.workchain ?? 0,
            publicKey: kp.publicKey,
            walletId: params.walletId,
        });
    }

    async connect() {
        const formattedAddress = this.address().toString({ testOnly: this.#network === 'testnet', bounceable: false });
        this.#ui.write(`Connected to wallet at address: ${formattedAddress}\n`);
    }

    async sendTransaction(
        address: Address,
        amount: bigint,
        payload?: Cell | undefined,
        stateInit?: StateInit | undefined,
    ) {
        await this.#wallet.sendTransfer({
            seqno: await this.#wallet.getSeqno(),
            secretKey: this.#secretKey,
            messages: [
                {
                    init: stateInit,
                    body: payload ?? new Cell(),
                    info: {
                        type: 'internal',
                        ihrDisabled: true,
                        ihrFee: 0n,
                        bounce: true,
                        bounced: false,
                        dest: address,
                        value: { coins: amount },
                        forwardFee: 0n,
                        createdAt: 0,
                        createdLt: 0n,
                    },
                },
            ],
            sendMode: SendMode.PAY_GAS_SEPARATELY,
        });

        this.#ui.write('Sent transaction');
    }

    address() {
        return this.#wallet.address;
    }
}
