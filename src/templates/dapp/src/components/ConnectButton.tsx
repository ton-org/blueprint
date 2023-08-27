import { ChevronDownIcon } from '@chakra-ui/icons';
import { Box, Button, IconButton, Menu, MenuButton, MenuItem, MenuList, useMediaQuery } from '@chakra-ui/react';
import React, { useCallback } from 'react';
import { useTonAddress, useTonConnectUI } from '@tonconnect/ui-react';

export function ConnectIcon() {
	return (
		<svg width="18" height="18" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
			<path
				d="M4 19.5L36 5L68 19.5L36 34L4 19.5ZM36.0001 70L37.52 36.63L68 19.5L36.0001 70ZM36.0001 70L34.48 36.63L4 19.5L36.0001 70Z"
				fill="white"
			/>
		</svg>
	);
}
export function ConnectButton() {
	const [isSmallScreen] = useMediaQuery('(max-width: 30em)');
	const [tonConnectUI] = useTonConnectUI();
	const address = useTonAddress();

	const handleButtonClick = useCallback(async () => {
		await tonConnectUI.connectWallet();
	}, []);

	const buttonProps = {
		onClick: handleButtonClick,
		colorScheme: 'blue',
		rounded: '13',
		height: '40px',
		mr: ['2', '0', '0', '0'],
	};

	return (
		<>
			<Box className="auth-button" style={{ zIndex: 2 }}>
				{address === '' ? (
					<Button leftIcon=<ConnectIcon /> {...buttonProps}>
						Connect Wallet
					</Button>
				) : isSmallScreen ? (
					<IconButton aria-label="Connect Wallet" icon={<ConnectIcon />} {...buttonProps} />
				) : (
					<Menu>
						<MenuButton
							as={Button}
							rounded="13"
							height="40px"
							rightIcon={<ChevronDownIcon />}
							mr={['2', '0', '0', '0']}
							bg="gray.300"
							colorScheme="gray"
						>
							{shorten(address)}
						</MenuButton>
						<MenuList>
							<MenuItem onClick={() => tonConnectUI.disconnect()}>Disconnect</MenuItem>
						</MenuList>
					</Menu>
				)}
			</Box>
		</>
	);
}

function shorten(address: string) {
	return address.slice(0, 4) + '...' + address.slice(-3);
}
