import { Box, Button, Flex, Input, InputGroup, InputRightElement, Text } from '@chakra-ui/react';
import React, { ChangeEvent, useEffect, useState } from 'react';
import { toNano } from '@ton/core';
import { FieldProps } from '../ActionCard';

export function AmountField(props: FieldProps) {
	const [amount, setAmount] = useState<string>('');
	const [touched, setTouched] = useState<boolean>(false);
	let defaultAmount: bigint | null = null;
	if (props.defaultValue) {
		try {
			const parsedDefault = eval(`(toNano) => { return ${props.defaultValue}; }`)(toNano);
			const type = typeof parsedDefault;
			if (type == 'bigint' || type == 'number') defaultAmount = parsedDefault;
			else throw new Error('defaultValue is not a number');
		} catch (e) {
			console.warn('Failed to parse default amount', e);
		}
	}
	useEffect(() => {
		if (amount) {
			setTouched(true);
			try {
				if (amount.includes('.')) {
					props.sendParam(props.paramName, Number(amount), true);
				} else {
					props.sendParam(props.paramName, BigInt(amount), true);
				}
			} catch {
				props.sendParam(props.paramName, undefined, props.optional || false);
			}
			return;
		}
		if (defaultAmount) props.sendParam(props.paramName, defaultAmount, true);
		else props.sendParam(props.paramName, undefined, props.optional || false);
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
			{!(props.overridden && (defaultAmount || props.optional)) && (
				<Flex alignItems="center" justifyContent={'center'} gap="2">
					<Box display="flex" alignItems="end">
						<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
							{props.fieldName || props.paramName}
							{defaultAmount || props.optional ? ' (optional)' : ''}:
						</Text>
					</Box>
					<InputGroup>
						<Input
							isInvalid={!amount ? (props.defaultValue || props.optional ? false : touched) : false}
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
			)}
		</>
	);
}
