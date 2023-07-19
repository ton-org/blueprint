import { isWalletInfoInjected } from '@tonconnect/sdk';
import { selector } from 'recoil';
import { connector } from 'src/connector';

// You can use any state manager, recoil is used just for example.

// You can use it to show your wallet selection dialog to user. When user selects wallet call connector.connect with selection.
// If dapp open into wallet's web browser, you shouldn't show selection modal for user, just get connection source via inWhichWalletBrowser
// and call connector.connect with that source
export const walletsListQuery = selector({
	key: 'walletsList',
	get: async () => {
		const walletsList = await connector.getWallets();

		const embeddedWallet = walletsList.filter(isWalletInfoInjected).find((wallet) => wallet.embedded);

		return {
			walletsList,
			embeddedWallet,
		};
	},
});
