import { Box, Button, Flex, Input, InputGroup, InputRightElement, Text } from '@chakra-ui/react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { toNano } from 'ton-core';
import { FieldProps } from '../ActionCard/ActionCard';

export function AmountField({ paramName, fieldName, param: sendParam, defaultValue, optional }: FieldProps) {
	const [amount, setAmount] = useState<string>('');
	const [touched, setTouched] = useState<boolean>(false);
	let defaultAmount: bigint | null = null;
	if (defaultValue) {
		try {
			const parsedDefault = eval(`(toNano) => { return ${defaultValue}; }`)(toNano);
			const type = typeof parsedDefault;
			if (type == 'bigint' || type == 'number') defaultAmount = parsedDefault;
			else throw new Error('defaultValue is not a number');
		} catch (e) {
			console.log('Failed to parse default amount', e);
		}
	}
	useEffect(() => {
		if (amount) {
			setTouched(true);
			try {
				if (amount.includes('.')) {
					sendParam(paramName, Number(amount), true);
				} else {
					sendParam(paramName, BigInt(amount), true);
				}
			} catch {
				sendParam(paramName, undefined, optional || false);
			}
			return;
		}
		if (defaultAmount) sendParam(paramName, defaultAmount, true);
		else sendParam(paramName, undefined, optional || false);
	}, [amount]);

	const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
		const inputValue = event.target.value;

		const decimalValue = inputValue.replace(/[^0-9.]/g, ''); // Filter out all characters except digits and dot
		if (decimalValue.includes('.')) {
			const [integerPart, decimalPart] = decimalValue.split('.');
			const truncatedDecimalPart = decimalPart.slice(0, 9);
			const limitedDecimalValue = `${integerPart}.${truncatedDecimalPart}`;
			setAmount(limitedDecimalValue);
		} else {
			setAmount(decimalValue);
		}
	};

	return (
		<>
			<Flex alignItems="center" justifyContent={'center'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}
						{defaultValue || optional ? '(optional)' : ''}:
					</Text>
				</Box>
				<InputGroup>
					<Input
						isInvalid={!amount ? (defaultValue || optional ? false : touched) : false}
						placeholder={defaultAmount ? defaultAmount.toString() : '12300'}
						size="md"
						value={amount}
						onChange={handleInputChange}
						onClick={() => setTouched(true)}
					></Input>
					<InputRightElement width="4rem">
						<Button
							fontSize="12px"
							fontWeight="medium"
							variant="outline"
							h="1.65rem"
							size="xs"
							colorScheme="gray"
							onClick={() => setAmount(toNano(amount).toString())}
						>
							nano
						</Button>
					</InputRightElement>
				</InputGroup>
			</Flex>
		</>
	);
}
