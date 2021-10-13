export const warn = (msg?: string | Event | unknown, ...args: any) => console.warn(msg, args);

export const error = (msg?: string | Event | unknown, ...args: any) => console.error(msg, args);

export const info = (msg?: string | Event | unknown, ...args: any) => console.info(msg, args);
// @TODO remove unknown
