import { CompilerConfig } from '@ton-ai-core/blueprint';

export const compile: CompilerConfig = {
    lang: 'func',
    targets: ['contracts/counter.fc'],
};
