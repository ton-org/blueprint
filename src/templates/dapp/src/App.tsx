import { Box, ChakraProvider, Flex, Spacer } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { AppTitle } from 'src/components/AppTitle';
import { AuthButton } from 'src/components/AuthButton/AuthButton';
import Footer from 'src/components/Footer';
import { connector } from 'src/utils/connector';
import BodyRoot from './BodyRoot';
import NetworkBadge from './components/NetBadge';
import Switch from './components/Switch';
import { getTheme, sendTheme } from './utils/theme';

function App() {
	const [isGetMethods, setIsGetMethods] = useState(false);
	const [pathParams, setPathParams] = useState<{ wrapper?: string; method?: string; address?: string } | null>(null);

	useEffect(() => {
		connector.restoreConnection();
		const url = new URL(window.location.href);
		const pathParts = url.pathname.split('/').filter((part) => part !== '');
		const [providedWrapperFromPath, providedMethodFromPath, providedAddressFromPath] = pathParts.slice(0, 3);
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
							<AppTitle title={'Jetton DAO Dapp'} />
							<Spacer />
							<Flex alignItems="center" mt="-6">
								{!!!pathParams?.method && <Switch setToParent={setIsGetMethods} />}
								<AuthButton />
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
