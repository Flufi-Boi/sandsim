import { canvas_scale, ctx } from "./canvas";
import { add, sub, type Pos } from './position';
import { isSolid, isTaken, addParticleDensity, swapParticle, toScreen, clearParticle, getParticleType, setFireTime, placeParticle, getParticle } from './scene';
import { get, type ValOrFunc } from "./utils";

export enum ParticleBehaviour {
    Solid,       // static
    SolidPowder, // powder but doesnt slide
    Powder,      // moves down and slides
    Liquid,      // moves down and slides and moves horizontally
    Gas,         // fills area
    Fire,        // goes up and lights other things on fire
}
export const solidLike = [
    ParticleBehaviour.Solid,
    ParticleBehaviour.SolidPowder,
    ParticleBehaviour.Powder
];

export type Particle = {
    type: ParticleType,
    temp: number,
    density?: number,
    fire_time?: number,
    clone_type?: ParticleType
}

export const min_density = 0.00001;

export enum ParticleType {
    Wood,
    Metal,

    Clone,

    SawDust,

    Water,
    Acid,
    Oil,
    LiquidOxygen,

    Steam,
    Gas,
    Oxygen,

    Fire,
    Magma
}

export const particleData: Record<ParticleType, {
    color: string,                           // its color

    behaviour: ValOrFunc<ParticleBehaviour>, // how it should behave
    heavyness?: number,                      // sortof falling priority
    slide_percent?: number,                  // how often it should slide
    resting_temp?: number,                   // base temp of particle
    heat_conductivity?: number,              // how fast temperature conducts

    acidic?: boolean,                        // is acidic
    acid_immune?: boolean,                   // doesnt not get corroded by acid
    
    flammable?: boolean,                     // if it burns in contact with fire
    fire_speed?: number,                     // how long it should burn for
    causes_fire?: ValOrFunc<boolean>,        // if it causes neighbors to burn
    emit_fire_percent?: ValOrFunc<number>,   // how often it should emit fire
}> = {
    [ParticleType.Wood]: {
        color: "#a3531d",

        behaviour: ParticleBehaviour.Solid,
        heavyness: 5,

        flammable: true
    },
    [ParticleType.Metal]: {
        color: "#bdbdbdff",

        behaviour: ParticleBehaviour.Solid,
        heavyness: 20,
        heat_conductivity: .2,
    },

    [ParticleType.Clone]: {
        color: "#f3d31cff",

        behaviour: ParticleBehaviour.Solid
    },

    [ParticleType.SawDust]: {
        color: "#eba14cff",

        behaviour: ParticleBehaviour.Powder,
        heavyness: 15,

        flammable: true
    },

    [ParticleType.Water]: {
        color: "#489ce0ff",

        behaviour: ParticleBehaviour.Liquid,
        heavyness: 10,
    },
    [ParticleType.Acid]: {
        color: "#73e048ff",

        behaviour: ParticleBehaviour.Liquid,
        heavyness: 10,

        acidic: true,
    },
    [ParticleType.Oil]: {
        color: "#3a2518ff",

        behaviour: ParticleBehaviour.Liquid,
        heavyness: 20,

        flammable: true,
    },
    [ParticleType.LiquidOxygen]: {
        color: "#b0edffff",

        behaviour: ParticleBehaviour.Liquid,
        resting_temp: -500,
        heavyness: 30,
    },

    [ParticleType.Steam]: {
        color: "#dddddd",

        behaviour: ParticleBehaviour.Gas,
        heavyness: -5,
        resting_temp: 120,
    },
    [ParticleType.Gas]: {
        color: "#a7ec66ff",

        behaviour: ParticleBehaviour.Gas,
        heavyness: -5,

        flammable: true
    },
    [ParticleType.Oxygen]: {
        color: "#52c8ec6c",

        behaviour: ParticleBehaviour.Gas,

        flammable: true
    },
    
    [ParticleType.Fire]: {
        color: "#ff9822ff",

        behaviour: ParticleBehaviour.Fire,
        heavyness: -5,
        resting_temp: 200,
        heat_conductivity: .5,

        acid_immune: true,

        fire_speed: 3,
        causes_fire: true,
    },
    [ParticleType.Magma]: {
        color: "#ff3502ff",

        behaviour: (par: Particle) => par.temp > 4000 ? ParticleBehaviour.Liquid : ParticleBehaviour.Solid,
        heavyness: 0,
        slide_percent: 0.1,
        resting_temp: 50000,

        emit_fire_percent: (par: Particle) => par.temp > 5000 ? .01 : 0
    }
};

export const puts_out_fires: ParticleType[] = [
    ParticleType.Water
];

export const neighbors: Pos[] = [
    [-1, 0],
    [1,  0],
    [0,  1],
    [0, -1],
];


export function updateParticle(particle: Particle, pos: Pos) {
    if (!particle)
        return;
    
    const data = particleData[particle.type];
    if (!data) {
        clearParticle(pos);
        return;
    }
    const behaviour = get(data.behaviour, particle);

    // fire
    if (behaviour == ParticleBehaviour.Fire) {
        particle.fire_time ??= 100;
        particle.temp = 200;
    }

    for (let i = 0; i < neighbors.length; i++) {
        const target = add(pos, neighbors[i]);
        const type = getParticleType(target);
        if (type == undefined)
            continue;
        particleReactions([pos, particle], [target, getParticle(target)!]);
    }

    if (data.emit_fire_percent !== undefined) {
        let emit = Math.random() < get(data.emit_fire_percent, particle);
        if (emit) {
            const target = add(pos, [0,1]);

            if (!isTaken(target))
                placeParticle(target, ParticleType.Fire);
        }
    }

    // burning
    if (particle.fire_time !== undefined) {
        particle.fire_time -= data.fire_speed ?? 1;

        if (particle.type !== ParticleType.Fire) {
            if (particle.fire_time <= 0)
                placeParticle(pos, ParticleType.Fire);

            if (Math.random() > .5) {
                const neighbor_i = Math.min(Math.random() * neighbors.length, neighbors.length - 1);
                const target = add(pos, neighbors[Math.floor(neighbor_i)]);

                if (!isTaken(target))
                    placeParticle(target, ParticleType.Fire);
            }
        } else {
            if (particle.fire_time <= 0)
                clearParticle(pos);
        }
    }

    // water evaporation
    if (particle.type == ParticleType.Water && particle.temp >= 100) {
        placeParticle(pos, ParticleType.Steam);
    }
    // water condensation
    if (particle.type == ParticleType.Steam && particle.temp < 80) {
        if (particle.density! > .05)
            placeParticle(pos, ParticleType.Water);
        else
            clearParticle(pos);
    }

    // oxygen evaporation
    if (particle.type == ParticleType.LiquidOxygen && particle.temp >= -450) {
        placeParticle(pos, ParticleType.Oxygen);
    }
    // oxygen condensation
    if (particle.type == ParticleType.Oxygen && particle.temp < -500) {
        if (particle.density! > .05)
            placeParticle(pos, ParticleType.LiquidOxygen);
        else
            clearParticle(pos);
    }

    // clone
    if (particle.type == ParticleType.Clone && particle.clone_type) {
        const neighbor_i = Math.min(Math.random() * neighbors.length, neighbors.length - 1);
        const target = add(pos, neighbors[Math.floor(neighbor_i)]);

        if (!isTaken(target))
            placeParticle(target, particle.clone_type);
    }

    moveParticle(particle, pos);
}
export function particleReactions(current: [Pos, Particle], other: [Pos, Particle]) {
    const pos = current[0];
    const particle = current[1];
    const data = particleData[particle.type];
    const behaviour = get(data.behaviour, particle);
    behaviour;
    
    const other_pos = other[0];
    const other_particle = other[1];
    const other_data = particleData[other_particle.type];
    const other_behaviour = get(other_data.behaviour, other_particle);
    other_behaviour;

    // heat diffusion
    {
        let heat_diffusion_amount = data.heat_conductivity ?? .01;
        heat_diffusion_amount *= other_data.heat_conductivity ?? .01;
        other_particle.temp += (particle.temp - other_particle.temp) * heat_diffusion_amount;
    }

    // fire
    if (get(data.causes_fire)) {
        if (get(other_data.flammable))
            setFireTime(other_pos);
    }

    // putting out fire
    if (puts_out_fires.includes(other_particle.type)) {
        if (particle.fire_time !== undefined)
            particle.fire_time = undefined;
        if (particle.type == ParticleType.Fire)
            clearParticle(pos);
    }

    // acid corrosion
    if (data.acidic) {
        if (!other_data.acidic && !other_data.acid_immune && Math.random() < .02)
            clearParticle(other_pos);
    }

    // clone
    if (!particle.clone_type && particle.type == ParticleType.Clone && other_particle.type != ParticleType.Clone) {
        particle.clone_type = other_particle.type;
    }
}
export function moveParticle(particle: Particle, pos: Pos) {
    const data = particleData[particle.type];
    const behaviour = get(data.behaviour, particle);

    // moving down
    if ([
        ParticleBehaviour.SolidPowder,
        ParticleBehaviour.Powder,
        ParticleBehaviour.Liquid
    ].includes(behaviour)) {
        const target = sub(pos, [0, 1]);

        if ([
            ParticleBehaviour.Liquid
        ].includes(behaviour)) {
            if (!isSolid(target) && pos[1] > 1)
                swapParticle(pos, target);
        } else {
            if (!isTaken(target) && pos[1] > 1)
                swapParticle(pos, target);
        }
    }

    // moving up (fire)
    if ([
        ParticleBehaviour.Fire,
    ].includes(behaviour)) {
        const target = add(pos, [0, 1]);

        if (!isSolid(target) && pos[1] > 1)
            swapParticle(pos, target);
    }

    let can_slide = true;
    if (data.slide_percent !== undefined)
        can_slide = Math.random() < data.slide_percent;

    // sliding
    if (can_slide && [
        ParticleBehaviour.Powder,
        ParticleBehaviour.Liquid
    ].includes(behaviour)) {
        const times = behaviour == ParticleBehaviour.Liquid ? 5 : 1;
        for (let i = 0; i < times; i++) {
            const target = sub(pos, [Math.round(Math.random()*2 - 1), 1]);

            if ([
                ParticleBehaviour.Liquid
            ].includes(behaviour)) {
                if (!isTaken(target) && pos[1] > 1)
                    swapParticle(pos, target);
            } else {
                if (!isSolid(target) && pos[1] > 1)
                    swapParticle(pos, target);
            }
        }
    }

    // moving horizontally
    if (can_slide && [
        ParticleBehaviour.Liquid
    ].includes(behaviour)) {
        for (let i = 0; i < 5; i++) {
            const target = sub(pos, [Math.round(Math.random()*2 - 1), 0]);
            if (!isTaken(target) && pos[1] > 1)
                swapParticle(pos, target);
        }
    }

    // gas diffusion
    if (behaviour == ParticleBehaviour.Gas) {
        particle.density ??= 1;

        const neighbor_i = Math.min(Math.random() * neighbors.length, neighbors.length - 1);
        const target = add(pos, neighbors[Math.floor(neighbor_i)]);

        addParticleDensity(target, particle.density / 3, particle.type, particle.temp);
        particle.density = particle.density / 3 * 2;
        if (particle.density < min_density)
            clearParticle(pos);
    }
}
export function renderParticle(particle: Particle, pos: Pos) {
    ctx.fillStyle = getParticleColor(particle);
    if (particle.density)
        ctx.globalAlpha = particle.density * 100;
    if (particle.type == ParticleType.Fire)
        ctx.globalAlpha *= Math.max(particle.fire_time! / 100, 0);
    ctx.fillRect(
        ...toScreen(pos),
        canvas_scale, canvas_scale
    );
    ctx.globalAlpha = 1;
}

// utils
export function getParticleColor(particle: Particle): string {
    return particleData[particle.type].color;
}