import { Box, Center, Text } from '@chakra-ui/react';
import { CHAIN } from '@tonconnect/ui';
import React from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';

const chainNames = {
	[CHAIN.MAINNET]: 'mainnet',
	[CHAIN.TESTNET]: 'testnet',
};

export default function NetworkBadge() {
	const [tonConnectUI] = useTonConnectUI();

	return (
		<>
			{tonConnectUI.wallet && (
				<Box
					bg={chainNames[tonConnectUI.wallet.account.chain] == 'mainnet' ? 'blue.500' : 'red.500'}
					width="100%"
					mb="-3"
				>
					<Box h="7px" />
					<Center>
						<Text fontWeight="bold" color="white" mb="16px">
							Using {chainNames[tonConnectUI.wallet.account.chain]}
						</Text>
					</Center>
				</Box>
			)}
		</>
	);
}
