import "./canvas";
import "./particle_bar";

import { clear, mouse_left, mouse_right, mouse_x, mouse_y } from "./canvas";
import { clearParticle, fromScreen, map, placeParticle, render, update } from "./scene";
import { add, random, round } from './position';
import { currentParticleType, getCurrentParticleTemperature } from "./state";

document.addEventListener("contextmenu", (e) => e.preventDefault());

setInterval(() => {
    update();
    clear();
    render();

    if (mouse_left) {
        for (let i = 0; i < 20; i++) {
            placeParticle(round(add(fromScreen([mouse_x, mouse_y]), random(5))), currentParticleType, getCurrentParticleTemperature());
        }
    }
    if (mouse_right) {
        for (let i = 0; i < 20; i++) {
            clearParticle(round(add(fromScreen([mouse_x, mouse_y]), random(5))));
        }
    }

    document.getElementById("particle-count")!.textContent = Object.keys(map).length.toString();
}, 1000/120);