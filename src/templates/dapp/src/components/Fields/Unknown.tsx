import { Badge, Box, Flex, Text, Tooltip } from '@chakra-ui/react';
import React, { useEffect } from 'react';
import { FieldProps } from '../ActionCard';
import { Address, Cell, beginCell, toNano } from '@ton/core';

export function UnknownField(props: FieldProps) {
	let defaultValue: any = null;
	if (props.defaultValue) {
		try {
			defaultValue = eval(`(Cell, beginCell, Address, Buffer, toNano) => { return ${props.defaultValue}; }`)(
				Cell,
				beginCell,
				Address,
				Buffer,
				toNano,
			);
			console.warn('received some default value, but no type check, may cause error', defaultValue);
		} catch (e) {
			console.warn('Failed to parse default value', e);
		}
	}

	useEffect(() => {
		if (defaultValue) props.sendParam(props.paramName, defaultValue, true);
		else if (props.optional) props.sendParam(props.paramName, undefined, true);
		else props.sendParam(props.paramName, undefined, false);
	}, []);

	return (
		<>
			{!(props.overridden && (defaultValue || props.optional)) && (
				<Flex alignItems="center" justifyContent={'left'} gap="2">
					<Box display="flex" alignItems="end">
						<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
							{props.fieldName || props.paramName}
							{defaultValue || props.optional ? ' (optional)' : ''}:
						</Text>
					</Box>
					<Tooltip label="You can implement it in components/Fields and add to ActionCard.">
						<Badge colorScheme="red">Unknown field type</Badge>
					</Tooltip>
				</Flex>
			)}
		</>
	);
}
