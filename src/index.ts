import { MainMenu, ModalWindow } from './user-interface';
import { EventManager } from './events/eventManager';
import { BufferGeometry } from 'three';
import { Source} from './lib/source';
import { Receiver } from './lib/receiver';
import { BeamTracer } from './lib/beam-tracer';
import { Renderer } from './renderer/renderer';
import { vec3, vec4, norm, mag } from './lib/math/math';
import * as THREE from 'three';

import { sizeof, sizeof_object } from './sizeof';

Object.assign(window, { sizeof, sizeof_object });



import './scss/nav.scss';
import './scss/main.scss';
import './scss/user-interface.scss';
import './scss/modal-window.scss';

// import { DeviceQueryAlert } from './device-query-alert'


// const dqa = new DeviceQueryAlert();
// dqa.show();
// // console.log(dqa);
let domlayer: HTMLDivElement = document.createElement('div');
domlayer.setAttribute('id', 'dom-layer');
domlayer.setAttribute('class', 'dom-layer');
document.body.appendChild(domlayer);



interface State {
	renderer: Renderer;
	beamtracer: BeamTracer;
	shouldUpdate: boolean;
	eventManager: EventManager;
	mainMenu;
	settingsWindow: ModalWindow;
}

const state: State = {
	shouldUpdate: false
} as State;
//@ts-ignore
window.norm = norm;
//@ts-ignore
window.mag = mag;

async function main() {
	Object.assign(window, { state });
	state.renderer = new Renderer({
		cameraPos: new THREE.Vector3(-41., 20., 35),
		cameraRot: new THREE.Euler(-0.4, -1.0, -0.33, "XYZ")
	});
	//@ts-ignore
	window.state = state;

	state.eventManager = new EventManager();

	const mainMenu = new MainMenu();
	state.mainMenu = mainMenu.create({
		tag: 'nav',
		id: 'main-menu',
		className: 'main-menu',
		state: 'collapsed',
		children: [
			{
				tag: 'ul',
				className: 'menu-button-list-top',
				children: [
					mainMenu.button('expand-main-menu', 'fa-bars', 'Expand/Collapse Menu'),
					mainMenu.seperator(),
					mainMenu.button('import', 'fa-upload', 'Import Geometry'),
					mainMenu.button('settings', 'fa-cog', 'Settings'),
				]
			},
			{
				tag: 'ul',
				className: 'menu-button-list-bottom',
				children: [
					mainMenu.button('show-debug-log', 'fa-bug', 'Show Debug Log'),
					mainMenu.button('open-shell', 'fa-terminal', 'Open Shell'),
				]
			}
		]
	});

	document.body.appendChild(state.mainMenu);

	state.settingsWindow = new ModalWindow("Settings");
	// state.settingsWindow.toggleVisibility();
	state.settingsWindow.checkbox("Vertex Normals", "vertex-normals-checkbox", "", true).addEventListener('change', e => {
		state.renderer.toggleVertexNormals((e.target as HTMLInputElement).checked);
	})

	state.settingsWindow.checkbox("Greyscale Surface Color", "greyscale-surface-color", "", false).addEventListener('change', e => {
		state.renderer.toggleGreyscaleSurfaceColor((e.target as HTMLInputElement).checked);
	})


	mainMenu.buttons['expand-main-menu'].addEventListener('click', e => {
		state.mainMenu.setAttribute('state', state.mainMenu.getAttribute('state') === "expanded" ? "collapsed" : "expanded");
	})

	mainMenu.buttons['import'].addEventListener('click', e => {
		const inp = document.createElement('input');
		inp.setAttribute('type', 'file');
		inp.setAttribute('class', 'hidden');
		document.body.appendChild(inp);
		inp.addEventListener('change', async ev => {
			let file = (ev.target as HTMLInputElement).files[0] || false;
			console.log(file);
			if (file) {
				const url = URL.createObjectURL(file);
				await state.renderer.addGeometry(url);
			}
			inp.remove();
		});
		inp.click();
		state.mainMenu.setAttribute('state', state.mainMenu.getAttribute('state') === "expanded" ? "collapsed" : "expanded");
	})

	mainMenu.buttons['settings'].addEventListener('click', e => {
		state.settingsWindow.toggleVisibility();
	})


	let defaultgeom = 'res/surface-contrib.obj';

	const geomarr = await state.renderer.addGeometry(defaultgeom);
	state.beamtracer = new BeamTracer({
		geometry: geomarr as BufferGeometry[],
		sources: [new Source({
			pos: new vec3(2, 2, 2),
			col: new vec4(0.5, 4.0, 0.3, 0.7),
			radius: .1,
			name: 'main_source'
		})],
		receivers: [new Receiver({
			pos: new vec3(-2, 2, 2),
			col: new vec4(4.0, 0.5, 0.3, 0.7),
			radius: .1,
			name: 'main_receiver'
		})]
	});

	state.renderer.setSurfacePhysicalMaterial({ metalness: 0.8, transparent: true, opacity: 0.15, color: 0x000000, side: THREE.DoubleSide })
	// console.log(state.beamtracer);

	state.renderer.addSourcesAndReceivers(state.beamtracer.sources, state.beamtracer.receivers);

		function dragChangedCallback(event) {
			if (event.value) {
				state.shouldUpdate = true;
			}
			else {
				state.shouldUpdate = false;
			}
		}

		function updateCallback(time) {

			if (state.shouldUpdate) {
				//@ts-ignore
				state.beamtracer.sources[0].posarr = state.renderer.sourcesAndReceivers.getObjectByName('main_source').position.toArray()
				//@ts-ignore
				state.beamtracer.receivers[0].posarr = state.renderer.sourcesAndReceivers.getObjectByName('main_receiver').position.toArray()


				// const flat = arr => arr.reduce((a, b) => a.concat(b));
				// var images = state.beamtracer.solve(3);
				// const intersections = images.map(x => x.intersection).filter(x => x);
				// const beams = intersections.map(x => [state.beamtracer.receivers[0].posarr, x, x, state.beamtracer.sources[0].posarr]);
				// state.renderer.updatePoints(intersections);
				// state.renderer.updateBeams(flat(beams));

			}
		}

	// let rays = state.beamtracer.getReflectionRays();

	// console.log(rays.map(x=>norm(x)));
	// 	// //@ts-ignore
	// 	var reflix = state.beamtracer.reflectReceiver();
	// 	// // console.log(reflix);
	// 	state.renderer.updatePoints(reflix.reflections.concat(reflix.itxs));
	// 	state.renderer.updateBeams(reflix.itxs.map(x => {
	// 		return [state.beamtracer.sources[0].posarr, x, x, state.beamtracer.receivers[0].posarr];
	// 	}).reduce((a, b) => {
	// 		return a.concat(b);
	// 	}, []));

		state.renderer.attachUpdateCallback(updateCallback);
		state.renderer.attachDragChangedCallback(dragChangedCallback);

	state.renderer.showReflections = true;
	// state.beamtracer.justReflect();


	// const flat = arr => arr.reduce((a, b) => a.concat(b));
	// var beams = state.beamtracer.solve(3);
	// console.log(images);
	// const intersections = images.map(x => x.intersection).filter(x => x);
	// const beams = .map(x => [state.beamtracer.receivers[0].posarr, x, x, state.beamtracer.sources[0].posarr]);
	// state.renderer.updatePoints(intersections);
	// state.renderer.updateBeams(beams);


	state.eventManager.event("toggle-orthomode").addHandler((e) => {
		state.renderer.toggleOrthographicCamera();
		console.log(e);
	})

	// state.eventManager.event("expand-main-menu").addHandler((e) => {
	// 	// state.renderer.toggleOrthographicCamera();
	// 	console.log(e);
	// 	MainMenu.setAttribute('state', MainMenu.getAttribute('state') === "collapsed" ? "expanded" : "collapsed");
	// })

	// const MainMenu = document.body.querySelector('.main-menu');
	// const MainMenuButtonIDs = [
	// 	"expand-main-menu",
	// 	"show-debug-log",
	// 	"open-shell",
	// 	"toggle-orthomode"
	// ];



	// MainMenuButtonIDs.forEach(x => {
	// 	MainMenu.querySelector(`#${x}`).addEventListener('click', e => {
	// 		state.eventManager.emit(x);
	// 	})
	// })

}


function test() {
	state.renderer.startMonteCarlo(state.renderer.sourcesAndReceivers.children[0].id, 15, 45, true);
	setTimeout(() => {
		state.renderer.stopAllMonteCarlo();
		console.log('done');
	}, 2000);
}
//@ts-ignore;
window.test = test;

main();
