import { dia } from "@joint/core";
import { createInertia } from "./d3-inertia.ts";
import { D3ZoomEvent, easeQuadOut, interval, select, timer, zoom, ZoomTransform } from 'd3';

export class Diagram {
	graph: dia.Graph;
	paper: dia.Paper;

	constructor(host: HTMLElement, container: HTMLElement) {
		this.graph = new dia.Graph();
		this.paper = new dia.Paper({
			el: host,
			model: this.graph,
			autoFreeze: true,
			background: { color: 'whitesmoke' },
			width: 2500,
			height: 1700,
			async: true,
			defaultRouter: {
				name: 'manhattan',
			}
		});
		this.enablePaperScroll(container);
	}

	private enablePaperScroll(container: HTMLElement) {
		const { paper } = this;// todo onResize store todo new api observers

		const containerD3 = select(container);
		const paperD3 = select(paper.el);
		const animName = 'zoom';

		const getTransform = () => containerD3.property('__zoom') as ZoomTransform;
		const setTransform = (transform: ZoomTransform) => containerD3.property('__zoom', transform);

		const inertia = createInertia({
			friction: 0.92,
			callback: (dx: number, dy: number) => {
				const tr = getTransform();
				const transform = tr.translate(dx / tr.k, dy / tr.k);
				setTransform(transform);
				paperD3.style("transform", `translate(${transform.x}px,${transform.y}px) scale(${transform.k})`);
			},
		});

		const isWheelEvt = (ev: D3ZoomEvent<HTMLElement, any>) => (ev.sourceEvent as Event | undefined)?.type === 'wheel';
		const d3zoom = zoom<HTMLElement, any>()
			.scaleExtent([0.1, 3]) // Set min/max zoom scale
			.on('start', (ev: D3ZoomEvent<HTMLElement, any>) => {
				if (!isWheelEvt(ev)) {
					const { x, y } = getTransform();
					inertia.start(x, y);
				}
			})
			.on("zoom", function (ev: D3ZoomEvent<HTMLElement, any>) {
				const { k, x, y } = ev.transform;
				paperD3.interrupt(animName);

				if (isWheelEvt(ev)) {
					inertia.interrupt();
					paperD3.transition(animName)
								 .duration(150) // todo use timer manual interpolation, then don't have to interrupt inertia
								 .ease(easeQuadOut)
								 .style("transform", `translate(${x}px,${y}px) scale(${k})`);
				}
				else {
					// TODO configurable drag delay 'heavy' drag
					inertia.move(x, y);
					paperD3.style("transform", `translate(${x}px,${y}px) scale(${k})`);
				}
			})
			.on('end', (ev: D3ZoomEvent<HTMLElement, any>) => {
				if (!isWheelEvt(ev)) inertia.end();
			});

		containerD3.call(d3zoom);
	}
}