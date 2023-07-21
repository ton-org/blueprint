import { RepeatIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Input, InputGroup, InputRightElement, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard/ActionCard';

export function StringField({ paramName, fieldName, param: sendParam, defaultValue, optional }: FieldProps) {
	const [text, setText] = useState<string>('');
	const [touched, setTouched] = useState<boolean>(false);
	let defaultText: string | null = null;
	if (defaultValue) {
		try {
			defaultText = eval(`() => { return ${defaultValue}; }`)();
		} catch (e) {
			console.log('Failed to parse default string', e);
		}
	}

	useEffect(() => {
		if (!touched) {
			if (text) setTouched(true);
			if (optional) {
				sendParam(paramName, undefined, true);
			} else {
				if (defaultText) sendParam(paramName, defaultText, true);
				else sendParam(paramName, text, true);
			}
		} else {
			sendParam(paramName, text, true);
		}
		return;
	}, [text]);

	const placeHolder = () => {
		if (touched) return 'type here';
		if (defaultText) return defaultText;
		if (optional) return "don't touch for undefined";
		return 'type here';
	};

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}
						{defaultText || optional ? '(optional)' : ''}:
					</Text>
				</Box>
				<InputGroup>
					<Input
						placeholder={placeHolder()}
						size="md"
						value={text}
						onChange={(e) => setText(e.target.value)}
						onClick={() => setTouched(true)}
					></Input>
					{defaultText && (
						<InputRightElement>
							<IconButton
								color="gray.400"
								aria-label="Reset to default"
								h="1.75rem"
								size="sm"
								icon={<RepeatIcon />}
								variant="ghost"
								onClick={() => {
									setText('');
									setTouched(false);
								}}
							/>
						</InputRightElement>
					)}
				</InputGroup>
			</Flex>
		</>
	);
}
