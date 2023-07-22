import { Badge, Box, Checkbox, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard';

export function NullField({ paramName, fieldName, param: sendParam, defaultValue }: FieldProps) {
	useEffect(() => {
		sendParam(paramName, null, true);
	}, []);

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}:
					</Text>
				</Box>
				<Badge colorScheme="blue">NULL</Badge>
			</Flex>
		</>
	);
}
