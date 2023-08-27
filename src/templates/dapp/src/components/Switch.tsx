import { IconButton, Tooltip } from '@chakra-ui/react';
import React, { useState } from 'react';

export function BackForthIcon({ isRotated }: { isRotated: boolean }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			id="up-down-arrow"
			style={{
				transform: `rotate(${isRotated ? '180deg' : '0deg'})`,
				transition: 'transform 0.3s ease',
			}}
		>
			<path
				fill="#ffffff"
				d="M7.175 4.386a.997.997 0 0 1 .552-.35c.178-.048.367-.048.544 0a.997.997 0 0 1 .555.35L11.7 7.145c.399.381.399 1 0 1.382l-.032.03a1.05 1.05 0 0 1-1.442 0L9.042 7.422V15c0 .552-.446 1-.997 1h-.09a.999.999 0 0 1-.997-1V7.42L5.773 8.558a1.05 1.05 0 0 1-1.442 0l-.032-.031a.949.949 0 0 1 0-1.382l2.876-2.758zm9.65 15.228a.997.997 0 0 1-.552.35 1.067 1.067 0 0 1-.544 0 .996.996 0 0 1-.555-.35L12.3 16.855a.949.949 0 0 1 0-1.382l.032-.03a1.05 1.05 0 0 1 1.442 0l1.185 1.135V9c0-.552.446-1 .997-1h.09c.55 0 .997.448.997 1v7.58l1.185-1.137a1.05 1.05 0 0 1 1.442 0l.032.031c.398.382.398 1 0 1.382l-2.876 2.758z"
			></path>
		</svg>
	);
}

export default function Switch({ setToParent }: { setToParent: (isGetMethods: boolean) => void }) {
	const [isGet, setIsGet] = useState(false);

	return (
		<Tooltip label={isGet ? 'Switch to send methods' : 'Switch to get methods'}>
			<IconButton
				variant="solid"
				colorScheme={isGet ? 'green' : 'blue'}
				aria-label="Send email"
				rounded="13"
				mr="2"
				onClick={() => {
					setIsGet(!isGet);
					setToParent(!isGet);
				}}
				icon={<BackForthIcon isRotated={isGet} />}
			/>
		</Tooltip>
	);
}
