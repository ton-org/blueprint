import { Box, Flex, Input, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { beginCell, Cell } from 'ton-core';
import { FieldProps } from '../ActionCard';

export function CellField({ paramName, fieldName, param: sendParam, defaultValue, optional }: FieldProps) {
	const [cellHexOrB64, setCellHexOrB64] = useState<string>('');
	const [parseError, setParseError] = useState<boolean>(false);
	const [touched, setTouched] = useState<boolean>(false);
	let defaultCell: Cell | null = null;
	if (defaultValue) {
		try {
			const parsedDefault = eval(`(Cell, beginCell) => { return ${defaultValue}; }`)(Cell, beginCell);
			if (parsedDefault instanceof Cell) defaultCell = parsedDefault;
			else throw new Error('defaultValue is not a Cell');
		} catch (e) {
			console.log('Failed to parse default cell', e);
		}
	}

	useEffect(() => {
		if (cellHexOrB64) {
			setTouched(true);
			// first try to parse as hex. if fails, try to parse as base64
			// if both fail, set error
			try {
				const parsedCell = Cell.fromBoc(Buffer.from(cellHexOrB64, 'hex'))[0];
				setParseError(false);
				sendParam(paramName, parsedCell, true);
			} catch {
				try {
					const parsedCell = Cell.fromBase64(cellHexOrB64);
					setParseError(false);
					sendParam(paramName, parsedCell, true);
				} catch {
					setParseError(true);
					sendParam(paramName, undefined, optional || false);
				}
			}
			return;
		}
		setParseError(false);
		if (defaultCell) sendParam(paramName, defaultCell, true);
		else sendParam(paramName, undefined, optional || false);
	}, [cellHexOrB64]);

	const isInvalid = () => {
		if (!cellHexOrB64) {
			if (defaultCell) return false;
			else return touched;
		} else return parseError;
	};

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}
						{defaultCell ? '(optional)' : ''}:
					</Text>
				</Box>
				<Input
					isInvalid={isInvalid()}
					placeholder={defaultCell ? defaultValue : 'HEX or base64 serialized cell'}
					size="md"
					value={cellHexOrB64}
					onChange={(e) => setCellHexOrB64(e.target.value)}
					onClick={() => setTouched(true)}
				></Input>
			</Flex>
		</>
	);
}