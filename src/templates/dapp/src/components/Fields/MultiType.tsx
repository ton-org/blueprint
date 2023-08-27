import { Box, Flex, Select, Text } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { choseField, FieldProps } from '../ActionCard';

type MultiTypeFieldProps = FieldProps & { types: string[] };

export function MultiTypeField(props: MultiTypeFieldProps) {
	const [selectedType, setSelectedType] = useState<string>('');
	const [Field, setReplacingField] = useState<JSX.Element | null>(null);

	useEffect(() => {
		if (props.optional) props.sendParam(props.paramName, undefined, true);
		else props.sendParam(props.paramName, undefined, false);
	}, []);

	useEffect(() => {
		if (selectedType) {
			let SelectedField = choseField(selectedType);
			setReplacingField(<SelectedField {...props} />);
		}
	}, [selectedType]);

	return (
		<>
			{!(props.overridden && props.optional) && (
				<>
					{Field ? (
						Field
					) : (
						<Flex alignItems="center" justifyContent={'left'} gap="2">
							<Box display="flex" alignItems="end">
								<Text marginTop="4" size="md" fontWeight="semibold" alignSelf="end">
									{props.fieldName || props.paramName}
									{props.optional ? ' (optional)' : ''}:
								</Text>
							</Box>
							<Select placeholder="Select type" onChange={(e) => setSelectedType(e.target.value)}>
								{props.types.map((type: string) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</Select>
						</Flex>
					)}
				</>
			)}
		</>
	);
}
