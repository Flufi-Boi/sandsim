import { canvas_particles_h, canvas_particles_w, canvas_scale } from './canvas';
import { renderParticle, updateParticle, type Particle, type ParticleType, particleData, solidLike, min_density, ParticleBehaviour } from './particle';
import { stringifyPos, type Pos, parsePos } from './position';
import { get } from './utils';

export const map: Record<string,Particle> = {};

export const resting_temp = 20;

export function update() {
    const entries = Object.entries(map);

    for (let i = 0; i < entries.length; i++) {
        const par_i = Math.floor(Math.random() * (entries.length - .9));
        const entry = entries[par_i];
        //const entry = entries[i];

        const pos = parsePos(entry[0]);

        updateParticle(entry[1], pos);
    }
}

export function render() {
    const entries = Object.entries(map);

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];

        if (!entry[1])
            return;

        const pos = parsePos(entry[0]);

        renderParticle(entry[1], pos);
    }
}

export function placeParticle(pos: Pos, type: ParticleType, temp?: number) {
    if (!inBounds(pos))
        return;

    const key = stringifyPos(pos);

    temp ??= particleData[type].resting_temp ?? resting_temp;

    map[key] = { type, temp };
}
export function setParticleType(pos: Pos, type: ParticleType) {
    if (!inBounds(pos))
        return;

    const key = stringifyPos(pos);

    const temp = particleData[type].resting_temp ?? resting_temp;

    if (map[key])
        map[key].type = type;
    else
        map[key] = { type, temp };
}
export function setFireTime(pos: Pos) {
    if (!inBounds(pos))
        return;

    const key = stringifyPos(pos);
    const par = map[key];
    if (par && par.fire_time == undefined)
        par.fire_time = Math.random() * 30 + 150;
}
export function addParticleDensity(pos: Pos, density: number, type: ParticleType, temp?: number): boolean {
    if (!inBounds(pos) || !type || density < min_density)
        return false;

    const key = stringifyPos(pos);
    const par = map[key];
    temp ??= particleData[type].resting_temp ?? resting_temp;

    if (par && par.type !== type)
        return false;

    if (par) {
        if (par.density)
            par.density += density;
        else
            par.density = density;
    } else
        map[key] = { type, temp, density };
    
    return true;

}
export function clearParticle(pos: Pos) {
    delete map[stringifyPos(pos)];
}
export function swapParticle(before: Pos, now: Pos) {
    if (!inBounds(before) || !inBounds(now))
        return;
    
    const before_key = stringifyPos(before);
    const now_key = stringifyPos(now);

    const before_particle = map[before_key];
    const now_particle = map[now_key];

    if (before_particle?.type && now_particle?.type) {
        const before_type = particleData[before_particle.type];
        const now_type = particleData[now_particle.type];

        if (now_type.behaviour !== ParticleBehaviour.Gas) {
            if (before_type.behaviour == ParticleBehaviour.Solid)
                return;
            if (now_type.behaviour == ParticleBehaviour.Solid)
                return;

            if (before_type.heavyness ?? 0 >= (now_type.heavyness ?? 0))
                return;
        }
    }
    
    if (before_particle)
        map[now_key] = {...before_particle};
    else
        delete map[now_key];

    if (now_particle)
        map[before_key] = {...now_particle};
    else
        delete map[before_key];
}

export function inBounds(pos: Pos): boolean {
    if (pos[0] < 0)
        return false;
    if (pos[0] > canvas_particles_w)
        return false;
    if (pos[1] <= 0)
        return false;
    if (pos[1] > canvas_particles_h)
        return false;

    return true;
}

export function getParticle(pos: Pos): Particle | undefined {
    return map[stringifyPos(pos)];
}
export function getParticleType(pos: Pos): ParticleType | undefined {
    return map[stringifyPos(pos)]?.type;
}
export function hasParticle(pos: Pos): boolean {
    const key = stringifyPos(pos);
    return key in map;
}
function getPar(pos: Pos): Particle | boolean {
    const key = stringifyPos(pos);
    const par = map[key];
    if (!par)
        return false;

    return par;
}

export function isTaken(pos: Pos): boolean {
    const par = getPar(pos);
    if (typeof par == "boolean")
        return par;
    
    return get(particleData[par.type].behaviour, par) !== ParticleBehaviour.Gas;
}
export function isSolid(pos: Pos): boolean {
    const par = getPar(pos);
    if (typeof par == "boolean")
        return par;
    
    return solidLike.includes(get(particleData[par.type].behaviour, par));
}

// utils
export function toScreen(pos: Pos): [number, number] {
    return [
        pos[0] * canvas_scale,
        (canvas_particles_h - pos[1]) * canvas_scale
    ];
}
export function fromScreen(pos: [number, number]): Pos {
    return [
        pos[0] / canvas_scale,
        canvas_particles_h - pos[1] / canvas_scale
    ];
}

// @ts-ignore
window.map = map;
