import fs from 'fs/promises';
import * as babelParser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import { Identifier } from '@babel/types';
import { readCompiled } from '../utils';
import { ParamInfo, Parameters, Functions, WrapperInfo } from '../templates/dapp/src/utils/wrappersConfigTypes';

export async function parseWrapper(filePath: string, className: string): Promise<WrapperInfo> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ast = babelParser.parse(content, {
        sourceType: 'module',
        plugins: ['typescript'],
        attachComment: false,
        ranges: false,
        createParenthesizedExpressions: true,
    });
    if (ast.errors.length > 0) throw ast.errors;

    let sendFunctions: Functions = {};
    let getFunctions: Functions = {};
    let canBeCreatedFromConfig = false;
    let canBeCreatedFromAddress = false;
    let configType: Parameters | undefined = undefined;
    traverse(ast, {
        ExportNamedDeclaration(path) {
            // parsing config type
            // similar to this (standard blueprint contract wrapper config):
            /*    export type LotteryConfig = {
                    operator: Address;
                    nftItemCode: Cell;
                    content: Cell;
                    ticketPrice: bigint;
                    startOnDeploy: boolean;
                    id?: number;
                };
            */
            const { node } = path;
            if (
                node.exportKind === 'type' &&
                node.declaration?.type === 'TSTypeAliasDeclaration' &&
                node.declaration?.id.type == 'Identifier' &&
                node.declaration?.id.name === className + 'Config' &&
                node.declaration?.typeAnnotation?.type === 'TSTypeLiteral'
            ) {
                configType = {};
                const { members } = node.declaration.typeAnnotation;
                for (const member of members) {
                    if (member.type === 'TSPropertySignature' && member.key.type === 'Identifier') {
                        const { name } = member.key;
                        const { typeAnnotation } = member;
                        if (typeAnnotation?.type === 'TSTypeAnnotation') {
                            if (typeAnnotation.typeAnnotation.type === 'TSTypeReference') {
                                const { typeName } = typeAnnotation.typeAnnotation;
                                if (typeName.type === 'Identifier') {
                                    configType[name] = { type: typeName.name, optional: member.optional };
                                }
                            } else {
                                configType[name] = {
                                    type: generate(typeAnnotation.typeAnnotation).code,
                                    optional: member.optional,
                                };
                            }
                        }
                    }
                }
            }
        },
        Class(path) {
            // parsing main wrapper class
            // taking send and get functions +
            // createFromConfig, createFromAddress existences
            const { node } = path;
            if (
                node.type == 'ClassDeclaration' &&
                node.id?.name == className &&
                node.implements &&
                node.implements.length === 1 &&
                node.implements.findIndex(
                    (i) =>
                        i.type == 'TSExpressionWithTypeArguments' &&
                        i.expression.type == 'Identifier' &&
                        i.expression.name == 'Contract'
                ) !== -1
            ) {
                path.traverse({
                    ClassMethod(path) {
                        const { node } = path;
                        if (
                            node.kind === 'method' &&
                            node.key.type === 'Identifier' &&
                            node.async === true &&
                            (node.key.name.startsWith('send') || node.key.name.startsWith('get'))
                        ) {
                            const isGet = node.key.name.startsWith('get');
                            let methodParams: Parameters = {};
                            path.node.params.forEach((param) => {
                                let p: Identifier = {} as Identifier;
                                let defaultValue: string | undefined;
                                if (param.type === 'Identifier') {
                                    p = param;
                                } else if (param.type === 'AssignmentPattern' && param.left.type === 'Identifier') {
                                    p = param.left;
                                    defaultValue = generate(param.right).code;
                                }
                                const { name, data } = paramData(p, defaultValue);

                                // remove provider param in all methods,
                                // and via in send methods
                                if (name === 'provider') {
                                } else if (!isGet && name === 'via') {
                                } else methodParams[name] = data;
                            });
                            if (isGet) getFunctions[node.key.name] = methodParams;
                            else sendFunctions[node.key.name] = methodParams;
                        }
                        // checking createFromConfig, createFromAddress existence
                        else if (node.kind === 'method' && node.key.type === 'Identifier' && node.static === true) {
                            if (node.key.name === 'createFromConfig') {
                                canBeCreatedFromConfig = true;
                            }
                            if (node.key.name === 'createFromAddress') {
                                canBeCreatedFromAddress = true;
                            }
                        }
                    },
                });
            }
        },
    });

    if (!canBeCreatedFromAddress) {
        throw new Error(`Cannot be created from address (need to create contract instance when sending)`);
    }

    let codeHex: string | undefined = undefined;
    if (canBeCreatedFromConfig) {
        try {
            codeHex = await readCompiled(className);
        } catch (e) {
            canBeCreatedFromConfig = false;
            if ('sendDeploy' in sendFunctions) delete sendFunctions['sendDeploy'];
        }
    }
    const relativePath = filePath.replace(process.cwd(), '.');
    return {
        sendFunctions,
        getFunctions,
        path: relativePath,
        deploy: {
            canBeCreatedFromConfig,
            configType,
            codeHex,
        },
    };
}

function paramData(param: Identifier, defaultValue?: string): { name: string; data: ParamInfo } {
    return {
        name: param.name,
        data: {
            type: param.typeAnnotation ? generate(param.typeAnnotation).code.slice(2) : 'any',
            optional: param.optional,
            defaultValue,
        },
    };
}
