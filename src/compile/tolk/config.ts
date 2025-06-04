export type TolkCompilerConfig = {
    lang: 'tolk';
    entrypoint: string;
    optimizationLevel?: number;
    withStackComments?: boolean;
    withSrcLineComments?: boolean;
    experimentalOptions?: string;
};
