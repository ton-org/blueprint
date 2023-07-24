const separator = window.location.pathname.replace(/\/+$/, '') + ':';

const setItem = localStorage.setItem;
localStorage.constructor.prototype.setItem = (key: unknown, value: string) =>
	setItem.apply(localStorage, [separator + key, value]);

const getItem = localStorage.getItem;
localStorage.constructor.prototype.getItem = (key: unknown) => getItem.apply(localStorage, [separator + key]);

const removeItem = localStorage.removeItem;
localStorage.constructor.prototype.removeItem = (key: unknown) => removeItem.apply(localStorage, [separator + key]);

export {};
