import React from 'react';
import ReactDOM from 'react-dom/client';
import { RecoilRoot } from 'recoil';
import App from './App';
import './index.scss';
import './patch-local-storage-for-github-pages';

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
	<RecoilRoot>
		<App />
	</RecoilRoot>,
);
