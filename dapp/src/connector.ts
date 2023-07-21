import { useToast } from '@chakra-ui/react';
import { SendTransactionRequest, TonConnect, UserRejectsError, WalletInfo, WalletInfoInjected } from '@tonconnect/sdk';
import { isMobile, openLink } from 'src/utils';

const dappMetadata = {
	manifestUrl:
		'https://gist.githubusercontent.com/1IxI1/d15922c552204bda4eff69c5c135c010/raw/4effadbae1d7b254d5f97cb19c9aec5ff4bc6e2c/manifest.json',
};

export const connector = new TonConnect(dappMetadata);
type Toast = ReturnType<typeof useToast>;

export async function sendTransaction(
	tx: SendTransactionRequest,
	wallet: WalletInfo,
	toast: Toast,
): Promise<{ boc: string }> {
	try {
		if ('universalLink' in wallet && !(wallet as WalletInfoInjected).embedded && isMobile()) {
			openLink(addReturnStrategy(wallet.universalLink, 'none'), '_blank');
		}

		const result = await connector.sendTransaction(tx);

		toast({
			title: 'Successful transaction',
			description:
				'You transaction was successfully sent. Please wait until the transaction is included to the TON blockchain.',
			status: 'success',
			duration: 5000,
			position: 'bottom-right',
		});
		console.log(`Send tx result: ${JSON.stringify(result)}`);
		return result;
	} catch (e) {
		let message = 'Send transaction error';
		let description = '';

		if (typeof e === 'object' && e instanceof UserRejectsError) {
			message = 'You rejected the transaction';
			description = 'Please try again and confirm transaction in your wallet.';
		}

		toast({
			title: message,
			description,
			status: 'error',
			duration: 5000,
			position: 'bottom-right',
		});
		console.log(e);
		throw e;
	}
}

export function addReturnStrategy(url: string, returnStrategy: 'back' | 'none'): string {
	const link = new URL(url);
	link.searchParams.append('ret', returnStrategy);
	return link.toString();
}
