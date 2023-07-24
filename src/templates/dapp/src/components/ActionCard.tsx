import {
	Badge,
	Box,
	Button,
	Card,
	CardBody,
	CardFooter,
	CardHeader,
	Center,
	Circle,
	Collapse,
	Flex,
	Heading,
	Text,
	useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import { useTonWallet } from 'src/hooks/useTonWallet';
import { Address, Builder, Cell, Slice } from 'ton-core';
import { Parameters, ParamInfo } from 'src/utils/wrappersData';
import {
	AddressField,
	AmountField,
	BoolField,
	BufferField,
	CellField,
	MultiTypeField,
	NullField,
	StringField,
	UnknownField,
} from './Fields';

export type ParamValue = Address | Buffer | boolean | bigint | Cell | number | string | undefined | null;
export type ParamWithValue = ParamInfo & { value: ParamValue };
export type ParamsWithValue = Record<string, ParamWithValue>;

export interface FieldProps {
	paramName: string;
	fieldName?: string;
	param: (name: string, value: ParamValue, correct: boolean) => void;
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
		case 'Buffer':
			return BufferField;
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
	isGet: boolean;
	outNames: string[];
	paramNames?: Record<string, string>;
	tabName?: string;
	buildAndExecute: (isGet: boolean, methodName: string, params: ParamsWithValue) => Promise<any>;
};

export const ActionCard: React.FC<ActionCardProps> = ({
	methodName,
	methodParams,
	isGet,
	paramNames,
	outNames,
	tabName,
	buildAndExecute,
}) => {
	const [enteredParams, setEnteredParams] = useState<ParamsWithValue>(methodParams as ParamsWithValue);
	const [paramFields, setParamFields] = useState<JSX.Element[]>([]);
	const [correctParams, setCorrectParams] = useState<string[]>([]);
	const [getResult, setGetResult] = useState<Object | null>(null);
	const [error, setError] = useState<string | null>(null);
	const wallet = useTonWallet();
	const toast = useToast();

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
				param: enterParam,
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

	const handleAction = () => {
		async function run() {
			setGetResult(null);
			setError(null);
			try {
				const res = await buildAndExecute(isGet, methodName, enteredParams);
				if (isGet) setGetResult(res);
			} catch (e) {
				if (e instanceof Error) {
					console.error('An error occurred:', e.message);
					setError(e.message);
				} else {
					console.error('An unknown error occurred:', e);
				}
			}
		}
		run();
	};

	const handleCopy = useCallback((text: string) => {
		navigator.clipboard.writeText(text);
		toast({
			title: 'Copied to clipboard',
			status: 'success',
			duration: 3000,
			position: 'bottom-right',
		});
	}, []);

	const stringifyResult = (res: any) => {
		const stringifyValue = (value: any): string => {
			if (value instanceof Slice) value = value.asCell();
			if (value instanceof Builder) value = value.asCell();
			if (value instanceof Cell) return value.toBoc().toString('hex');
			if (value && value.toString) return value.toString();
			else return JSON.stringify(value);
		};
		let outsWithNames: { name: string; strValue: string }[] = [];
		if (typeof res === 'object' && res !== null && !Address.isAddress(res)) {
			for (const [key, value] of Object.entries(res)) {
				outsWithNames.push({ name: key, strValue: stringifyValue(value) });
			}
		} else outsWithNames.push({ name: outNames ? outNames[0] : '', strValue: stringifyValue(res) });
		return outsWithNames;
	};

	const shadow = () => (paramFields.length === 0 ? 'xl' : 'none');
	const rounding = () => (paramFields.length === 0 ? '18' : 'none');
	const width = () => (paramFields.length === 0 ? '0' : '100%');
	const buttonPadding = () => (paramFields.length === 0 ? '-8' : '-3');

	return (
		<Center>
			<Card
				variant="outline"
				mb="50"
				boxShadow={[shadow(), 'xl', 'xl', 'xl']}
				p={{ base: '3', sm: '6' }}
				rounded={[rounding(), '18', '18', '18']}
				minWidth={[width(), '0', '0', '0']}
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
					<Flex direction="column" flex="1" mb={['0', '-2', '-2', '-2']}>
						<Button
							height="12"
							mt={buttonPadding()}
							mb="-2"
							rounded="100"
							flex="1"
							py="4"
							isLoading={isInactive()}
							loadingText={inactiveButtonText()}
							spinner={<Circle />}
							onClick={handleAction}
						>
							{isGet ? 'Run get method' : 'Send transaction'}
						</Button>
						<Collapse in={!!getResult} animateOpacity>
							{/* prevent text from going out of the card */}
							<Flex mt="8" direction="column" maxWidth={['22em', '45px', '58em', '70em']} whiteSpace="normal">
								<Text fontSize="14" color="gray.500" fontWeight="semibold" align="center">
									Result:
								</Text>
								{stringifyResult(getResult).map(({ name, strValue }) => (
									<Box key={name} mt="2">
										<Text _hover={{ color: 'blue.500' }} cursor="pointer" onClick={() => handleCopy(strValue)}>
											{name ? (
												<>
													<Badge>{name}: </Badge> {strValue}
												</>
											) : (
												<Center>{strValue}</Center>
											)}
										</Text>
									</Box>
								))}
							</Flex>
						</Collapse>

						<Collapse in={!!error} animateOpacity>
							{/* prevent text from going out of the card */}
							<Flex mt="8" direction="column" maxWidth={['22em', '45px', '58em', '70em']} whiteSpace="normal">
								<Text fontSize="14" color="gray.500" fontWeight="semibold" align="center">
									Error:
								</Text>
								{stringifyResult(getResult).map(({ name, strValue }) => (
									<Box key={name} mt="2">
										<Text
											_hover={{ color: 'red.300' }}
											color="red.500"
											cursor="pointer"
											key={name}
											onClick={() => handleCopy(strValue)}
										>
											{error}
										</Text>
									</Box>
								))}
							</Flex>
						</Collapse>
					</Flex>
				</CardFooter>
			</Card>
		</Center>
	);
};
