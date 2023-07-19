import { Badge, Box, Center, Text } from '@chakra-ui/react';
import { CHAIN } from '@tonconnect/sdk';
import React, { useEffect, useRef, useState } from 'react';
import { useTonWallet } from 'src/hooks/useTonWallet';

const chainNames = {
	[CHAIN.MAINNET]: 'mainnet',
	[CHAIN.TESTNET]: 'testnet',
};

export default function NetworkBadge() {
	const wallet = useTonWallet();

	return (
		<>
			{wallet && (
				<Box bg={chainNames[wallet.account.chain] == 'mainnet' ? 'blue.500' : 'red.500'} width="100%" mb="-3">
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
