import { ParticleType, particleData } from './particle';
import { setCurrentParticleType } from "./state";
import { resting_temp } from './scene';

export function generate() {
    const container = document.getElementById("particle-bar")!;

    const particles: string[] = Object.values(ParticleType)
        .filter(p => typeof p == "string");
    
    for (let i = 0; i < particles.length; i++) {
        const particle = particles[i];
        
        const elem = document.createElement("button");
        elem.addEventListener("click", () => {
            // @ts-expect-error
            setCurrentParticleType(ParticleType[particle]);
            // @ts-expect-error
            (document.getElementById("temp-input") as HTMLInputElement).value = particleData[ParticleType[particle]].resting_temp ?? resting_temp;
        })
        elem.textContent = particle;
        container.appendChild(elem);
    }
}
generate();

// @ts-ignore
window.particleType = ParticleType;
