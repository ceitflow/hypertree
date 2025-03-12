import { dia } from "@joint/core";
import { createInertia } from "./d3-inertia.ts";
import { D3ZoomEvent, select, ZoomTransform } from 'd3';
import { Screen } from "./screen";

type DiagramOptions = {
	screen: false | { // false disables screen
		padding: number;
		inertia: boolean; // default true
		scroll: boolean; // default true
		touchSupport: boolean; // default true; set to false if user wants to handle manual
	},
	render: {
		virtualization: boolean;
	}
}

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

		const { paper } = this; // todo onResize store todo new api observers
		const paperD3 = select(paper.el);
		const screen = new Screen(paper, container);
		// const { wheeled, startMove, dblclicked } = d3zoom.bind(d3zoom)();

		// todo expose d3 options (touchable, dblclick)
		// todo need one source of truth for transform (basically api for scroller)
		// 1. transform store
		// 2. constraints
		// 3. drag and zoom logic
		// 3. touch support

		paper.on({
			// 'all': (...args) => console.log(args[1].type),
			'blank:pointerdown': (evt, x, y) => {

			},
			'blank:pointermove': (evt) => {
				// tr.translateBy(x, y);
			},
			'cell:mousewheel': (...args) => {
				// diagram.zoom(evt | { ox, oy, scale }) // exposing api for manual control
			},
			'blank:mousewheel': (...args) => {

			},
			'paper:pinch': (...args) => console.log(args),
		});

		const containerD3 = select(container);
		// TODO flow
		// 1. paper trigger d3
		// 2. d3 triggers inertias (*sync real paper transform with d3)
		// 3. inertias update transform
		// containerD3.dispatch()

		const getTransform = () => containerD3.property('__zoom') as ZoomTransform;
		const setTransform = (transform: ZoomTransform) => {
			containerD3.property('__zoom', transform);
			paperD3.style("transform", `translate(${transform.x}px,${transform.y}px) scale(${transform.k})`);
		}

		const inertia = createInertia({
			friction: 0.92,
			callback: (dx: number, dy: number) => {
				const t = getTransform();
				setTransform(t.translate(dx / t.k, dy / t.k));
			},
		});

		const isWheelEvt = (ev: D3ZoomEvent<HTMLElement, any>) => (ev.sourceEvent as Event | undefined)?.type === 'wheel';

		// TODO use jointjs events to trigger pan and zoom
		// todo but first zoom manual timer with inertia

		/*const ddddd3zoom = d3zoom()
			.scaleExtent([0.1, 3]) // Set min/max zoom scale
			.on('start', (ev: D3ZoomEvent<HTMLElement, any>) => {
				const { x, y, k } = getTransform();
				if (isWheelEvt(ev)) {
					// zoomInertia.zoom(k);
				}
				else {
					inertia.start(x, y);
				}
			})
			.on("zoom", function (ev: D3ZoomEvent<HTMLElement, any>) {
				const { k, x, y } = ev.transform;
				paperD3.interrupt();

				// todo reset transform to 'start' zoom
				// handle zoom in zoomInertia

				if (isWheelEvt(ev)) {
					paperD3.style("transform", `translate(${x}px,${y}px) scale(${k})`);
					// zoomInertia.zoom(k);
					// inertia.interrupt();
					// paperD3.transition(animName)
					// 			 .duration(150) // todo use timer manual interpolation, then don't have to interrupt inertia
					// 			 .ease(easeQuadOut)
					// 			 .style("transform", `translate(${x}px,${y}px) scale(${k})`);
				}
				else {
					// TODO configurable drag delay 'heavy' drag
					inertia.move(x, y);
					paperD3.style("transform", `translate(${x}px,${y}px) scale(${k})`);
				}
			})
			.on('end', (ev: D3ZoomEvent<HTMLElement, any>) => {
				if (isWheelEvt(ev)) {
					// zoomInertia.animate();
				}
				else inertia.animate();
			});

		containerD3.call(ddddd3zoom);*/
	}
}