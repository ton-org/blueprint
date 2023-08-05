import { Box, ChakraProvider, Flex, Spacer } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { AppTitle } from 'src/components/AppTitle';
import { ConnectButton } from 'src/components/ConnectButton';
import Footer from 'src/components/Footer';
import BodyRoot from './BodyRoot';
import NetworkBadge from './components/NetBadge';
import Switch from './components/Switch';
import { getTheme, sendTheme } from './utils/theme';
import { THEME, useTonConnectUI } from '@tonconnect/ui-react';

function App() {
	const [isGetMethods, setIsGetMethods] = useState(false);
	const [pathParams, setPathParams] = useState<{ wrapper?: string; method?: string; address?: string } | null>(null);
	const [tcUI, setTcUIOptions] = useTonConnectUI();

	useEffect(() => {
		tcUI.connector.restoreConnection();
		setTcUIOptions({
			uiPreferences: {
				theme: THEME.LIGHT,
				borderRadius: 's',
				colorsSet: {
					[THEME.LIGHT]: {
						accent: '#2b6cb0',
					},
				},
			},
		});

		const origUrl = new URL(window.location.href);

		let base = process.env.PUBLIC_URL || origUrl.origin;

		if (!base.includes(origUrl.origin)) {
			base = origUrl.origin + base;
		}

		const urlStringNoBase = window.location.href.replace(base, origUrl.origin);
		const urlToParse = new URL(urlStringNoBase);
		const pathParts = urlToParse.pathname.split('/').filter((part) => part !== '');

		let providedWrapperFromPath: string | undefined;
		let providedMethodFromPath: string | undefined;
		let providedAddressFromPath: string | undefined;
		if (pathParts.length > 0) {
			[providedWrapperFromPath, providedMethodFromPath, providedAddressFromPath] = pathParts.slice(0, 3);
		} else {
			const params = new URLSearchParams(urlToParse.search);
			if ((providedWrapperFromPath = params.get('wrapper') || undefined)) {
				if ((providedMethodFromPath = params.get('method') || undefined)) {
					providedAddressFromPath = params.get('address') || undefined;
				}
			}
		}
		setPathParams({
			wrapper: providedWrapperFromPath,
			method: providedMethodFromPath,
			address: providedAddressFromPath,
		});

		if (providedMethodFromPath?.startsWith('get')) setIsGetMethods(true);
	}, []);

	return (
		<ChakraProvider theme={isGetMethods ? getTheme : sendTheme}>
			<NetworkBadge />
			<Box padding={['30px 0px', '20px 20px', '20px 70px', '20px 70px']} backgroundColor="#f7f9fb" min-height="100vh">
				<Box minHeight="90vh">
					<Box fontFamily="Inter" bg="#F7F9FB">
						<Flex>
							<AppTitle title={process.env.REACT_APP_TITLE || 'Blueprint Dapp'} />
							<Spacer />
							<Flex alignItems="center" mt="-6">
								{!!!pathParams?.method && <Switch setToParent={setIsGetMethods} />}
								<ConnectButton />
							</Flex>
						</Flex>
						{pathParams && (
							<BodyRoot
								areGetMethods={isGetMethods}
								wrapperFromUrl={pathParams.wrapper}
								methodFromUrl={pathParams.method}
								addressFromUrl={pathParams.address}
							/>
						)}
					</Box>
				</Box>
				<Footer />
			</Box>
		</ChakraProvider>
	);
}

export default App;
