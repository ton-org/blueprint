import { Button, Input, Modal } from 'antd';
import React, { forwardRef, Ref, useImperativeHandle, useState } from 'react';

function DebuggerComponent(props: {}, ref: Ref<unknown>) {
	const [inputValue, setInputValue] = useState('');
	const [modalOpen, setModalOpen] = useState(false);

	useImperativeHandle(ref, () => ({
		open: () => setModalOpen(true),
	}));

	const onSubmit = () => {
		if (inputValue) {
			const s = document.createElement('script');
			s.src = 'https://remotejs.com/agent/agent.js';
			s.setAttribute('data-consolejs-channel', inputValue);
			document.head.appendChild(s);
		} else {
			alert('Wrong data-consolejs-channel value');
		}
		setModalOpen(false);
	};

	return (
		<Modal open={modalOpen} onOk={onSubmit} onCancel={() => setModalOpen(false)}>
			<h1>
				Configure remote{' '}
				<a href="https://remotejs.com/" target="_blank" rel="noreferrer">
					debugger
				</a>
			</h1>
			<h5>
				Paste <code>data-consolejs-channel</code> value
			</h5>
			<Input value={inputValue} onChange={(e) => setInputValue(e.target.value)}></Input>
		</Modal>
	);
}

export const Debugger = forwardRef(DebuggerComponent);
