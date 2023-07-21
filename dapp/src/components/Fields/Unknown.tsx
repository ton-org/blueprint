import { Badge, Box, Checkbox, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard/ActionCard';

export function UnknownField({ paramName, fieldName, param: sendParam, defaultValue }: FieldProps) {
	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}
						{defaultValue ? '(optional)' : ''}:
					</Text>
				</Box>
				<Badge colorScheme="red">Unknown field type</Badge>
			</Flex>
		</>
	);
}
