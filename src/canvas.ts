
export const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
export const ctx = canvas.getContext("2d")!;
ctx.imageSmoothingEnabled = false;

export function clear() {
    ctx.fillStyle = "transparent";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

export const canvas_particles_w = 100;
export const canvas_particles_h = 100;
export const canvas_scale = 8;

export function resizeCanvas() {
    canvas.width = canvas_particles_w * canvas_scale;
    canvas.height = canvas_particles_h * canvas_scale;

    canvas.style.width = (canvas_particles_w * canvas_scale) + "px";
    canvas.style.height = (canvas_particles_h * canvas_scale) + "px";
}
resizeCanvas();

export let mouse_left: boolean = false;
export let mouse_right: boolean = false;
export let mouse_x: number = 0;
export let mouse_y: number = 0;

export function attachToCanvas() {
    function getCoordsFromEv(e: MouseEvent): [number, number] {
        const rect = canvas.getBoundingClientRect();

        const x = (e.clientX - rect.left) * (canvas.width / rect.width);
        const y = (e.clientY - rect.top) * (canvas.height / rect.height);

        return [x,y];
    }

    canvas.addEventListener("mousedown", (e) => {
        if (e.button == 0)
            mouse_left = true;
        if (e.button == 2)
            mouse_right = true;
        [mouse_x, mouse_y] = getCoordsFromEv(e);
    });
    canvas.addEventListener("mouseup", (e) => {
        if (e.button == 0)
            mouse_left = false;
        if (e.button == 2)
            mouse_right = false;
    });
    canvas.addEventListener("mousemove", (e) => {
        [mouse_x, mouse_y] = getCoordsFromEv(e);
    });
    document.addEventListener("mousemove", (e) => {
        [mouse_x, mouse_y] = getCoordsFromEv(e);
    });
}
attachToCanvas();
