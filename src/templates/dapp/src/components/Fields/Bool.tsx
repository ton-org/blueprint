import { Box, Checkbox, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard';

export function BoolField(props: FieldProps) {
	const [value, setValue] = useState<boolean>(false);

	useEffect(() => {
		if (props.defaultValue) {
			try {
				setValue(Boolean(props.defaultValue));
			} catch (e) {
				console.warn('Failed to parse default bool', e);
			}
		}
	}, []);

	useEffect(() => {
		props.sendParam(props.paramName, value, true);
	}, [value]);

	return (
		<>
			{!props.overridden && (
				<Flex alignItems="center" justifyContent={'left'} gap="2">
					<Box display="flex" alignItems="end">
						<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
							{props.fieldName || props.paramName}:
						</Text>
					</Box>
					<Checkbox isChecked={value} onChange={(e) => setValue(e.target.checked)} />
				</Flex>
			)}
		</>
	);
}
