import "./canvas";
import "./particle_bar";

import { clear, mouse_left, mouse_right, mouse_x, mouse_y } from "./canvas";
import { clearParticle, fromScreen, getParticleType, map, placeParticle, render, update } from "./scene";
import { add, random, round } from './position';
import { currentParticleType, getCurrentParticleTemperature } from "./state";
import { ParticleBehaviour, particleData } from './particle';

document.addEventListener("contextmenu", (e) => e.preventDefault());

setInterval(() => {
    update();
    clear();
    render();

    const size = (document.getElementById("brush-size") as HTMLInputElement).valueAsNumber;

    if (mouse_left) {
        for (let i = 0; i < size ** 2; i++) {
            const target = round(add(fromScreen([mouse_x, mouse_y]), random(size)));
            let par = getParticleType(target);
            if (par) {
                const behaviour = particleData[currentParticleType].behaviour;
                if (typeof behaviour == "number") {
                    if (
                        [
                            ParticleBehaviour.SolidPowder,
                            ParticleBehaviour.Powder,
                            ParticleBehaviour.Liquid,
                            ParticleBehaviour.Gas,
                        ].includes(particleData[currentParticleType].behaviour as number),
                        particleData[par].behaviour == ParticleBehaviour.Solid
                    ) {
                        continue;
                    }
                }
            }
            placeParticle(target, currentParticleType, getCurrentParticleTemperature());
        }
    }
    if (mouse_right) {
        for (let i = 0; i < size ** 2; i++) {
            clearParticle(round(add(fromScreen([mouse_x, mouse_y]), random(size))));
        }
    }

    document.getElementById("particle-count")!.textContent = Object.keys(map).length.toString();
}, 1000/120);