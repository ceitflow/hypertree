import { Timer, timer } from "d3";

export type InertiaOptions = {
	friction: number;
	callback: (dx: number, dy: number) => void;
}

export type Inertia = {
	start: (_x: number, _y: number) => void;
	move: (_x: number, _y: number) => void;
	end: () => void;
	interrupt: () => void;
}

export const createInertia = (opt: InertiaOptions): Inertia => {
	let x = 0;
	let y = 0;
	let prevX = 0;
	let prevY = 0;
	let dx = 0;
	let dy = 0;
	let frameLoop: Timer;

	function start(_x: number, _y: number): void {
		interrupt();
		x = _x;
		y = _y;
		prevX = _x;
		prevY = _y;
		frameLoop = timer(() => {
			dx = x - prevX;
			dy = y - prevY;
			prevX = x;
			prevY = y;
		});
	}

	function move(_x: number, _y: number): void {
		x = _x;
		y = _y
	}

	function end(): void {
		frameLoop.stop();
		frameLoop = timer(() => {
			opt.callback(dx, dy);
			dx *= opt.friction;
			dy *= opt.friction;
			if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) frameLoop.stop();
		});
	}

	function interrupt(): void {
		frameLoop?.stop();
		x = 0;
		y = 0;
		prevX = 0;
		prevY = 0;
		dx = 0;
		dy = 0;
	}

	return { start, move, end, interrupt };
}
