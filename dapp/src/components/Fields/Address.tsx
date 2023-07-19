import { Box, Flex, Input, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { Address } from 'ton-core';
import { FieldProps } from '../ActionCard/ActionCard';

export function AddressField({ paramName, fieldName, sendParam, defaultValue, optional }: FieldProps) {
	const [sendTo, setSendTo] = useState<string>('');
	const [addressError, setAddressError] = useState<boolean>(false);
	const [touched, setTouched] = useState<boolean>(false);
	let defaultAddress: Address | null = null;
	if (defaultValue) {
		try {
			defaultAddress = eval(`(Address) => { return ${defaultValue}; }`)(Address);
		} catch (e) {
			console.log('Failed to parse default address', e);
		}
	}

	useEffect(() => {
		if (sendTo) {
			setTouched(true);
			try {
				const parsedAddress = Address.parse(sendTo);
				setAddressError(false);
				sendParam(paramName, parsedAddress, true);
			} catch {
				setAddressError(true);
				sendParam(paramName, undefined, optional || false);
			}
			return;
		}
		setAddressError(false);
		if (defaultAddress) sendParam(paramName, defaultAddress, true);
		else sendParam(paramName, undefined, optional || false);
	}, [sendTo]);

	const isInvalid = () => {
		if (!sendTo) {
			if (defaultAddress) return false;
			else return touched;
		} else return addressError;
	};

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}
						{defaultAddress ? '(optional)' : ''}:
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
		</>
	);
}
