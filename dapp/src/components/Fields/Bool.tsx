import { Box, Checkbox, Flex, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FieldProps } from '../ActionCard/ActionCard';

export function BoolField({ paramName, fieldName, sendParam, defaultValue }: FieldProps) {
	const [value, setValue] = useState<boolean>(false);

	useEffect(() => {
		if (defaultValue) {
			try {
				setValue(Boolean(defaultValue));
			} catch (e) {
				console.log('Failed to parse default bool', e);
			}
		}
	}, []);

	useEffect(() => {
		sendParam(paramName, value, true);
	}, [value]);

	return (
		<>
			<Flex alignItems="center" justifyContent={'left'} gap="2">
				<Box display="flex" alignItems="end">
					<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
						{fieldName || paramName}:
					</Text>
				</Box>
				<Checkbox isChecked={value} onChange={(e) => setValue(e.target.checked)} />
			</Flex>
		</>
	);
}
