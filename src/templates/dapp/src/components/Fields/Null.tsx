import { Badge, Box, Flex, Text } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { FieldProps } from '../ActionCard';

export function NullField(props: FieldProps) {
	useEffect(() => {
		props.sendParam(props.paramName, null, true);
	}, []);

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{props.fieldName || props.paramName}:
					</Text>
				</Box>
				<Badge colorScheme="blue">NULL</Badge>
			</Flex>
		</>
	);
}
