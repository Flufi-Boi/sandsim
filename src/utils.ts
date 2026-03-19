
export type ValOrFunc<T> = T | ((...args: any[]) => T);

export function get<T>(val: ValOrFunc<T>, ...args: any[]): T {
    if (typeof val == "function")
        return (val as Function)(...args);
    return val;
}
