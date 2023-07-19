import { Button, Card, CardBody, CardFooter, CardHeader, Center, Circle, Heading, Text } from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTonWallet } from 'src/hooks/useTonWallet';
import { Address, Cell } from 'ton-core';
import { AddressField } from '../Fields/Address';
import { AmountField } from '../Fields/Amount';
import { BoolField } from '../Fields/Bool';
import { CellField } from '../Fields/Cell';
import { MultiTypeField } from '../Fields/MultiType';
import { NullField } from '../Fields/Null';
import { StringField } from '../Fields/String';
import { UnknownField } from '../Fields/Unknown';
import { Parameters, ParamInfo } from './../../../parseArguments';

export type ParamValue = Cell | Address | string | boolean | bigint | number | undefined | null;
export type ParamWithValue = ParamInfo & { value: ParamValue };
export type ParamsWithValue = Record<string, ParamWithValue>;

export interface FieldProps {
	paramName: string;
	fieldName?: string;
	sendParam: (name: string, value: ParamValue, correct: boolean) => void;
	defaultValue?: string;
	optional?: boolean;
}

export const choseField = (type: String) => {
	if (type == 'bigint | number' || type == 'number | bigint') return AmountField;
	switch (type) {
		case 'Address':
			return AddressField;
		case 'boolean':
			return BoolField;
		case 'bigint':
		case 'number':
			return AmountField;
		case 'string':
			return StringField;
		case 'Cell':
		case 'Builder':
		case 'Slice':
			return CellField;
		case 'null':
			return NullField;
		default:
			return UnknownField;
	}
};

export type ActionCardProps = {
	methodName: string;
	methodParams: Parameters;
	paramNames?: Record<string, string>;
	tabName?: string;
	buildAndSend: (methodName: string, params: ParamsWithValue) => Promise<void>;
};

export const ActionCard: React.FC<ActionCardProps> = ({
	methodName,
	methodParams,
	paramNames,
	tabName,
	buildAndSend,
}) => {
	const [enteredParams, setEnteredParams] = useState<ParamsWithValue>(methodParams as ParamsWithValue);
	const [paramFields, setParamFields] = useState<JSX.Element[]>([]);
	const [correctParams, setCorrectParams] = useState<string[]>([]);
	const wallet = useTonWallet();

	const enterParam = (name: string, value: ParamValue, correct = true) => {
		console.log('enterParam', name, value, correct);
		let newParams = { ...enteredParams };
		newParams[name].value = value;
		setEnteredParams(newParams);
		let newCorrectParams = correctParams;
		if (correct) {
			if (newCorrectParams.indexOf(name) === -1) newCorrectParams.push(name);
		} else newCorrectParams = correctParams.filter((param) => param !== name);
		setCorrectParams(newCorrectParams);
	};

	useEffect(() => {
		let fields: JSX.Element[] = [];
		for (const [paramName, { type, defaultValue }] of Object.entries(methodParams)) {
			const optional = paramName.endsWith('?');
			const fieldName = paramNames ? paramNames[paramName] || paramName : paramName;
			const props: FieldProps = {
				paramName,
				fieldName,
				sendParam: enterParam,
				defaultValue,
				optional,
			};
			let Field = choseField(type);
			if (Field == UnknownField) {
				const types = type.split('|').map((t) => t.trim());
				if (types.length > 1) {
					fields.push(<MultiTypeField key={paramName} {...props} types={types} />);
					continue;
				}
			}
			fields.push(<Field key={paramName} {...props} />);
		}
		setParamFields(fields);
	}, []);

	const isInactive = () => {
		if (correctParams.length !== Object.keys(methodParams).length) return true;
		if (!wallet) return true;
		return false;
	};

	const inactiveButtonText = () => {
		if (correctParams.length !== Object.keys(methodParams).length) return 'Provide arguments';
		if (!wallet) return 'Connect wallet';
	};

	return (
		<Center>
			<Card
				variant="outline"
				mb="50"
				boxShadow={['none', 'xl', 'xl', 'xl']}
				p={{ base: '3', sm: '6' }}
				rounded={{ base: '0', sm: '18' }}
				whiteSpace="nowrap"
			>
				<CardHeader marginTop={['0', '-2', '-2', '-2']}>
					<Center>
						<Heading size="lg">{tabName || methodName}</Heading>
					</Center>
				</CardHeader>
				<CardBody marginTop="-10" marginBottom="-5">
					<ul>{paramFields}</ul>
				</CardBody>
				<CardFooter>
					<Button
						height="12"
						marginTop="-3"
						marginBottom={['2', '-2', '-2', '-2']}
						rounded="100"
						flex="1"
						colorScheme="blue"
						isLoading={isInactive()}
						loadingText={inactiveButtonText()}
						spinner={<Circle />}
						onClick={() => {
							buildAndSend(methodName, enteredParams);
						}}
					>
						Send transaction
					</Button>
				</CardFooter>
			</Card>
		</Center>
	);
};
