import React from 'react';
import ReactDOM from 'react-dom/client';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import App from './App';
import './index.scss';
import './patch-local-storage-for-github-pages';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<TonConnectUIProvider manifestUrl="https://gist.githubusercontent.com/1IxI1/d15922c552204bda4eff69c5c135c010/raw/791202048994565640de5555ec6c4bc2b03d45b9/manifest.json">
		<App />
	</TonConnectUIProvider>,
);
