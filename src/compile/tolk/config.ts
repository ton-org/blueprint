export type TolkCompilerConfig = {
    lang: 'tolk';
    entrypoint: string;
    optimizationLevel?: number;
    withStackComments?: boolean;
    experimentalOptions?: string;
};