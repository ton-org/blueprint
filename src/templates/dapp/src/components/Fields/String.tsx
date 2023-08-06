import { RepeatIcon } from '@chakra-ui/icons';
import { Box, Flex, IconButton, Input, InputGroup, InputRightElement, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard';

export function StringField(props: FieldProps) {
	const [text, setText] = useState<string>('');
	const [touched, setTouched] = useState<boolean>(false);
	let defaultString: string | null = null;
	if (props.defaultValue) {
		try {
			defaultString = eval(`() => { return ${props.defaultValue}; }`)();
		} catch (e) {
			console.warn('Failed to parse default string', e);
		}
	}

	useEffect(() => {
		if (!touched) {
			if (text) setTouched(true);
			if (props.optional) {
				props.sendParam(props.paramName, undefined, true);
			} else {
				if (defaultString) props.sendParam(props.paramName, defaultString, true);
				else props.sendParam(props.paramName, text, true);
			}
		} else {
			props.sendParam(props.paramName, text, true);
		}
		return;
	}, [text]);

	const placeHolder = () => {
		if (touched) return 'type here';
		if (defaultString) return defaultString;
		if (props.optional) return "don't touch for undefined";
		return 'type here';
	};

	return (
		<>
			{!(props.overridden && (defaultString || props.optional)) && (
				<Flex alignItems="center" justifyContent={'left'} gap="2">
					<Box display="flex" alignItems="end">
						<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
							{props.fieldName || props.paramName}
							{defaultString || props.optional ? ' (optional)' : ''}:
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
						{defaultString && (
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
			)}
		</>
	);
}
