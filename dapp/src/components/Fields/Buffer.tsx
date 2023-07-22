import { Box, Flex, Input, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard';

export function BufferField({ paramName, fieldName, param: sendParam, defaultValue, optional }: FieldProps) {
	const [bufferHexOrB64, setBufferHexOrB64] = useState<string>('');
	const [parseError, setParseError] = useState<boolean>(false);
	const [touched, setTouched] = useState<boolean>(false);
	let defaultBuffer: Buffer | null = null;
	if (defaultValue) {
		try {
			const parsedDefault = eval(`() => { return ${defaultValue}; }`)();
			if (parsedDefault instanceof Buffer) defaultBuffer = parsedDefault;
			else throw new Error('defaultValue is not a Buffer');
		} catch (e) {
			console.log('Failed to parse default Buffer', e);
		}
	}

	useEffect(() => {
		if (bufferHexOrB64) {
			setTouched(true);
			// first try to parse as hex. if fails, try to parse as base64
			// if both fail, set error
			try {
				const parsed = Buffer.from(bufferHexOrB64, 'hex');
				setParseError(false);
				sendParam(paramName, parsed, true);
			} catch {
				try {
					const parsedCell = Buffer.from(bufferHexOrB64, 'base64');
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
		if (defaultBuffer) sendParam(paramName, defaultBuffer, true);
		else sendParam(paramName, undefined, optional || false);
	}, [bufferHexOrB64]);

	const isInvalid = () => {
		if (!bufferHexOrB64) {
			if (defaultBuffer) return false;
			else return touched;
		} else return parseError;
	};

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}
						{defaultBuffer ? '(optional)' : ''}:
					</Text>
				</Box>
				<Input
					isInvalid={isInvalid()}
					placeholder={defaultBuffer ? defaultValue : 'HEX or base64 bytes'}
					size="md"
					value={bufferHexOrB64}
					onChange={(e) => setBufferHexOrB64(e.target.value)}
					onClick={() => setTouched(true)}
				></Input>
			</Flex>
		</>
	);
}
