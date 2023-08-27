import { Box, Flex, Input, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard';

export function BufferField(props: FieldProps) {
	const [bufferHexOrB64, setBufferHexOrB64] = useState<string>('');
	const [parseError, setParseError] = useState<boolean>(false);
	const [touched, setTouched] = useState<boolean>(false);
	let defaultBuffer: Buffer | null = null;
	if (props.defaultValue) {
		try {
			const parsedDefault = eval(`() => { return ${props.defaultValue}; }`)();
			if (parsedDefault instanceof Buffer) defaultBuffer = parsedDefault;
			else throw new Error('defaultValue is not a Buffer');
		} catch (e) {
			console.warn('Failed to parse default Buffer', e);
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
				props.sendParam(props.paramName, parsed, true);
			} catch {
				try {
					const parsedCell = Buffer.from(bufferHexOrB64, 'base64');
					setParseError(false);
					props.sendParam(props.paramName, parsedCell, true);
				} catch {
					setParseError(true);
					props.sendParam(props.paramName, undefined, props.optional || false);
				}
			}
			return;
		}
		setParseError(false);
		if (defaultBuffer) props.sendParam(props.paramName, defaultBuffer, true);
		else props.sendParam(props.paramName, undefined, props.optional || false);
	}, [bufferHexOrB64]);

	const isInvalid = () => {
		if (!bufferHexOrB64) {
			if (defaultBuffer) return false;
			else return touched;
		} else return parseError;
	};

	return (
		<>
			{!(props.overridden && (defaultBuffer || props.optional)) && (
				<Flex alignItems="center" justifyContent={'left'} gap="2">
					<Box display="flex" alignItems="end">
						<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
							{props.fieldName || props.paramName}
							{defaultBuffer || props.optional ? ' (optional)' : ''}:
						</Text>
					</Box>
					<Input
						isInvalid={isInvalid()}
						placeholder={defaultBuffer ? props.defaultValue : 'HEX or base64 bytes'}
						size="md"
						value={bufferHexOrB64}
						onChange={(e) => setBufferHexOrB64(e.target.value)}
						onClick={() => setTouched(true)}
					></Input>
				</Flex>
			)}
		</>
	);
}
