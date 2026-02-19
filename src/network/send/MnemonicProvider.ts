import { Buffer } from 'buffer';

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
import { KeyPair, keyPairFromSecretKey } from '@ton/crypto';

import { SendProvider } from './SendProvider';
import { UIProvider } from '../../ui/UIProvider';
import { BlueprintTonClient } from '../NetworkProvider';
import { Network } from '../Network';
import { wallets, WalletVersion } from './wallets';
import { getW5NetworkGlobalId, TETRA_DOMAIN } from '../../utils/network.utils';

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
    domain?: number;
    networkId?: number;
};

export class MnemonicProvider implements SendProvider {
    private readonly wallet: OpenedContract<WalletInstance>;
    private readonly secretKey: Buffer;
    private readonly client: BlueprintTonClient;
    private readonly ui: UIProvider;
    private readonly network: Network;

    constructor(params: MnemonicProviderParams) {
        if (!(params.version in wallets)) {
            throw new Error(
                `Unknown wallet version ${params.version}, expected one of ${Object.keys(wallets).join(', ')}`,
            );
        }
        this.client = params.client;
        this.network = params.network;
        const kp = keyPairFromSecretKey(params.secretKey);

        this.wallet = openContract<WalletInstance>(this.createWallet(params, kp), (params) =>
            this.client.provider(
                params.address,
                params.init && {
                    ...params.init,
                    data: params.init.data ?? undefined,
                    code: params.init.code ?? undefined,
                },
            ),
        );
        this.secretKey = kp.secretKey;
        this.ui = params.ui;
    }

    private createWallet(params: MnemonicProviderParams, kp: KeyPair): WalletInstance {
        const networkDomain = params.network === 'tetra' ? TETRA_DOMAIN : undefined;
        const domain = params.domain ? { type: 'l2' as const, globalId: params.domain } : networkDomain;
        const networkGlobalId = params.networkId ?? getW5NetworkGlobalId(params.network);

        if (params.version === 'v5r1') {
            return wallets[params.version].create({
                publicKey: kp.publicKey,
                walletId: {
                    networkGlobalId: networkGlobalId,
                    context: {
                        workchain: params.workchain ?? 0,
                        subwalletNumber: params.subwalletNumber ?? 0,
                        walletVersion: 'v5r1',
                    },
                },
                domain,
            });
        }

        return wallets[params.version].create({
            workchain: params.workchain ?? 0,
            publicKey: kp.publicKey,
            walletId: params.walletId,
            domain,
        });
    }

    async connect() {
        const formattedAddress = this.address().toString({
            testOnly: this.network === 'testnet',
            bounceable: false,
        });
        this.ui.write(`Connected to wallet at address: ${formattedAddress}\n`);
    }

    async sendTransaction(
        address: Address,
        amount: bigint,
        payload?: Cell | undefined,
        stateInit?: StateInit | undefined,
    ) {
        await this.wallet.sendTransfer({
            seqno: await this.wallet.getSeqno(),
            secretKey: this.secretKey,
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

        this.ui.write('Sent transaction');
    }

    address() {
        return this.wallet.address;
    }
}
