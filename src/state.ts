import { ParticleType } from "./particle";

export let currentParticleType: ParticleType = ParticleType.Wood;
export const setCurrentParticleType = (type: ParticleType) =>
    currentParticleType = type;

export let getCurrentParticleTemperature: () => number = () =>{
    const elem = document.getElementById("temp-input") as HTMLInputElement;
    return Number(elem.value);
}
export let setCurrentParticleTemperature = (temp: number) => {
    const elem = document.getElementById("temp-input") as HTMLInputElement;
    elem.value = temp.toString();
}
