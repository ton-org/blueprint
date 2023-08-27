import { extendTheme, withDefaultColorScheme } from '@chakra-ui/react';

export const sendTheme = extendTheme({}, withDefaultColorScheme({ colorScheme: 'blue' }));
export const getTheme = extendTheme({}, withDefaultColorScheme({ colorScheme: 'green' }));
