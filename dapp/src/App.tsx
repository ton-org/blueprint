import { DownloadIcon, EmailIcon, UpDownIcon } from '@chakra-ui/icons';
import { Box, Center, ChakraProvider, Flex, IconButton, Spacer, Text } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { AppTitle } from 'src/components/AppTitle/AppTitle';
import { AuthButton } from 'src/components/AuthButton/AuthButton';
import Footer from 'src/components/Footer';
import { connector } from 'src/connector';
import './app.scss';
import BodyRoot from './BodyRoot';
import NetworkBadge from './components/NetBadge';
import Switch from './components/Switch';

function App() {
	useEffect(() => {
		connector.restoreConnection();
	}, []);

	return (
		<ChakraProvider>
			<NetworkBadge />
			<Box padding={['30px 0px', '20px 20px', '20px 70px', '20px 70px']} backgroundColor="#f7f9fb" min-height="100vh">
				<Box minHeight="90vh">
					<Box fontFamily="Inter" bg="#F7F9FB">
						<Flex>
							<AppTitle title={'Jetton DAO Dapp'} />
							<Spacer />
							<Flex alignItems="center" mt="-6">
								<Switch />
								<AuthButton />
							</Flex>
						</Flex>
						<BodyRoot />
					</Box>
				</Box>
				<Footer />
			</Box>
		</ChakraProvider>
	);
}

export default App;
