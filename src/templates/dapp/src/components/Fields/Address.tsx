import { Box, Flex, Input, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Address } from '@ton/core';
import { FieldProps } from '../ActionCard';

export function AddressField(props: FieldProps) {
	const [sendTo, setSendTo] = useState<string>('');
	const [addressError, setAddressError] = useState<boolean>(false);
	const [touched, setTouched] = useState<boolean>(false);
	let defaultAddress: Address | null = null;
	if (props.defaultValue) {
		try {
			defaultAddress = eval(`(Address) => { return ${props.defaultValue}; }`)(Address);
		} catch (e) {
			console.warn('Failed to parse default address', e);
		}
	}

	useEffect(() => {
		if (sendTo) {
			setTouched(true);
			try {
				const parsedAddress = Address.parse(sendTo);
				setAddressError(false);
				props.sendParam(props.paramName, parsedAddress, true);
			} catch {
				setAddressError(true);
				props.sendParam(props.paramName, undefined, props.optional || false);
			}
			return;
		}
		setAddressError(false);
		if (defaultAddress) props.sendParam(props.paramName, defaultAddress, true);
		else props.sendParam(props.paramName, undefined, props.optional || false);
	}, [sendTo]);

	const isInvalid = () => {
		if (!sendTo) {
			if (defaultAddress) return false;
			else return touched;
		} else return addressError;
	};

	return (
		<>
			{!(props.overridden && (defaultAddress || props.optional)) && (
				<Flex alignItems="center" justifyContent={'left'} gap="2">
					<Box display="flex" alignItems="end">
						<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
							{props.fieldName || props.paramName}
							{defaultAddress ? ' (optional)' : ''}:
						</Text>
					</Box>
					<Input
						isInvalid={isInvalid()}
						placeholder={defaultAddress ? defaultAddress.toString() : 'EQabc123'}
						size="md"
						value={sendTo}
						onChange={(e) => setSendTo(e.target.value)}
						onClick={() => setTouched(true)}
					></Input>
				</Flex>
			)}
		</>
	);
}
