import { Badge, Flex, Spacer, Text } from '@chakra-ui/react';
import { CHAIN } from '@tonconnect/sdk';
import React, { useEffect, useRef, useState } from 'react';
import { useTonWallet } from 'src/hooks/useTonWallet';

export function AppTitle({ title }: { title: string }) {
	const wallet = useTonWallet();

	return (
		<Text fontSize={['24', '24', '32', '32']} fontWeight="extrabold" ml={['3', '0', '0', '0']}>
			{title}
		</Text>
	);
}
