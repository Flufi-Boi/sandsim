
export type Pos = [number, number];

export function round(pos: Pos): Pos {
    return [
        Math.round(pos[0]),
        Math.round(pos[1])
    ];
}
export function random(range: number): Pos {
    return [
        (Math.random() - .5) * range,
        (Math.random() - .5) * range
    ];
}

export function add(a: Pos, b: Pos): Pos {
    return [a[0] + b[0], a[1] + b[1]];
}
export function sub(a: Pos, b: Pos): Pos {
    return [a[0] - b[0], a[1] - b[1]];
}
export function mul(a: Pos, b: Pos): Pos {
    return [a[0] * b[0], a[1] * b[1]];
}
export function div(a: Pos, b: Pos): Pos {
    return [a[0] / b[0], a[1] / b[1]];
}

export function parsePos(str: string): Pos {
    const i = str.indexOf("/");
    return [
        Number(str.slice(0, i)),
        Number(str.slice(i + 1))
    ] as Pos;
}
export function stringifyPos(pos: Pos): string {
    return pos[0] + "/" + pos[1];
}