import { CHAIN } from '@tonconnect/sdk';
import { useMemo } from 'react';
import { Address } from 'ton';

export function useSlicedAddress(address: string | null | undefined, chain?: CHAIN) {
	return useMemo(() => {
		if (!address) {
			return '';
		}

		// use any library to convert address from 0:<hex> format to user-friendly format
		const userFriendlyAddress = Address.parseRaw(address).toString({ testOnly: chain === CHAIN.TESTNET });

		return userFriendlyAddress.slice(0, 4) + '...' + userFriendlyAddress.slice(-3);
	}, [address]);
}
