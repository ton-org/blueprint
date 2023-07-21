import { ChevronDownIcon } from '@chakra-ui/icons';
import {
	Box,
	Button,
	IconButton,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	useMediaQuery,
} from '@chakra-ui/react';
import { Dropdown, notification, Space } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'react-qr-code';
import { useRecoilValueLoadable } from 'recoil';
import { addReturnStrategy, connector } from 'src/connector';
import { useForceUpdate } from 'src/hooks/useForceUpdate';
import { useSlicedAddress } from 'src/hooks/useSlicedAddress';
import { useTonWallet } from 'src/hooks/useTonWallet';
import { useTonWalletConnectionError } from 'src/hooks/useTonWalletConnectionError';
import { walletsListQuery } from 'src/state/wallets-list';
import { isDesktop, isMobile, openLink } from 'src/utils';
import './style.scss';

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

export function AuthButton() {
	const [modalUniversalLink, setModalUniversalLink] = useState('');
	const [isSmallScreen] = useMediaQuery('(max-width: 30em)');
	const forceUpdate = useForceUpdate();
	const wallet = useTonWallet();
	const onConnectErrorCallback = useCallback(() => {
		setModalUniversalLink('');
		notification.error({
			message: 'Connection was rejected',
			description: 'Please approve connection to the dApp in your wallet.',
		});
	}, []);
	useTonWalletConnectionError(onConnectErrorCallback);

	const walletsList = useRecoilValueLoadable(walletsListQuery);

	const address = useSlicedAddress(wallet?.account.address, wallet?.account.chain);

	useEffect(() => {
		if (modalUniversalLink && wallet) {
			setModalUniversalLink('');
		}
	}, [modalUniversalLink, wallet]);

	const handleButtonClick = useCallback(async () => {
		// Use loading screen/UI instead (while wallets list is loading)
		if (!(walletsList.state === 'hasValue')) {
			setTimeout(handleButtonClick, 200);
		}

		if (!isDesktop() && walletsList.contents.embeddedWallet) {
			connector.connect({ jsBridgeKey: walletsList.contents.embeddedWallet.jsBridgeKey });
			return;
		}

		const tonkeeperConnectionSource = {
			universalLink: walletsList.contents.walletsList[0].universalLink,
			bridgeUrl: walletsList.contents.walletsList[0].bridgeUrl,
		};

		const universalLink = connector.connect(tonkeeperConnectionSource);

		if (isMobile()) {
			openLink(addReturnStrategy(universalLink, 'none'), '_blank');
		} else {
			setModalUniversalLink(universalLink);
		}
	}, [walletsList]);

	return (
		<>
			<Box className="auth-button" style={{ zIndex: 2 }}>
				{wallet ? (
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
							{address}
						</MenuButton>
						<MenuList>
							<MenuItem onClick={() => connector.disconnect()}>Disconnect</MenuItem>
						</MenuList>
					</Menu>
				) : isSmallScreen ? (
					<IconButton
						aria-label="Connect Wallet"
						icon={<ConnectIcon />}
						onClick={handleButtonClick}
						colorScheme="blue"
						mr={['2', '0', '0', '0']}
						rounded="13"
						height="40px"
					/>
				) : (
					<Button
						leftIcon={<ConnectIcon />}
						onClick={handleButtonClick}
						colorScheme="blue"
						rounded="13"
						height="40px"
						mr={['2', '0', '0', '0']}
					>
						Connect Wallet
					</Button>
				)}
			</Box>
			<Modal isOpen={!!modalUniversalLink} onClose={() => setModalUniversalLink('')}>
				<ModalOverlay />
				<ModalContent bg={'#F7F9FB'} borderRadius="13">
					<ModalHeader>Connect to Tonkeeper</ModalHeader>
					<ModalCloseButton />
					<ModalBody>
						<QRCode
							size={256}
							style={{ height: '260px', maxWidth: '100%', width: '100%' }}
							value={modalUniversalLink}
							viewBox={`0 0 256 256`}
						/>
					</ModalBody>
					<ModalFooter>
						<Button rounded="13" colorScheme="blue" onClick={() => setModalUniversalLink('')}>
							Close
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
