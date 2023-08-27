import { Box, Center, Text } from '@chakra-ui/react';
import { CHAIN } from '@tonconnect/ui';
import React from 'react';
import { useTonWallet } from '@tonconnect/ui-react';

const chainNames = {
	[CHAIN.MAINNET]: 'mainnet',
	[CHAIN.TESTNET]: 'testnet',
};

export default function NetworkBadge() {
	const wallet = useTonWallet();

	return (
		<>
			{wallet && (
				<Box bg={wallet.account.chain == CHAIN.MAINNET ? 'blue.500' : 'red.500'} width="100%" mb="-3">
					<Box h="7px" />
					<Center>
						<Text fontWeight="bold" color="white" mb="16px">
							Using {chainNames[wallet.account.chain]}
						</Text>
					</Center>
				</Box>
			)}
		</>
	);
}
