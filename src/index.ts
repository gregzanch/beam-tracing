import { MainMenu, ModalWindow, SideMenu, View } from './user-interface';
import { EventManager } from './events/eventManager';
import { BufferGeometry } from 'three';
import { Source} from './lib/source';
import { Receiver } from './lib/receiver';
import { BeamTracer } from './lib/beam-tracer';
import { Renderer } from './renderer/renderer';
import { vec3, vec4, norm, mag } from './lib/math/math';
import * as THREE from 'three';

import { clamp } from './lib/math/math';

import { sizeof, sizeof_object } from './sizeof';



Object.assign(window, { sizeof, sizeof_object });



import './scss/nav.scss';
import './scss/main.scss';
import './scss/user-interface.scss';
import './scss/modal-window.scss';
import './scss/side-menu.scss';


// import { DeviceQueryAlert } from './device-query-alert'



// // console.log(dqa);
let domlayer: HTMLDivElement = document.createElement('div');
domlayer.setAttribute('id', 'dom-layer');
domlayer.setAttribute('class', 'dom-layer');
document.body.appendChild(domlayer);

interface settings {
	renderer: {
		camera: {
			fov: number;
			focalLength: number;
			type: "Perspective" | "Orthographic";
			near: number;
			far: number;
			position: {
				x: number;
				y: number;
				z: number;
			}
			rotation: {
				x: number;
				y: number;
				z: number;
			}
		},
		scene: {

		}
	}
}

interface Point {
	x: number;
	y: number;
}

interface State {
	renderer: Renderer;
	beamtracer: BeamTracer;
	shouldUpdate: boolean;
	eventManager: EventManager;
	mainMenu;
	sideMenu;
	settingsWindow: ModalWindow;
	grabTarget;
	grabPoint: Point;
	mouse: Point;
	previousMouse: Point;
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
	state.mouse = { x: 0, y: 0 };
	state.previousMouse = { x: 0, y: 0 };
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
					mainMenu.button('start-stop-trace', 'fa-play', 'Start Trace'),
					mainMenu.button('select', 'fa-mouse-pointer', 'Select'),
					mainMenu.button('add-source', 'fa-plus', 'Add Source'),
					mainMenu.button('configure', 'fa-wrench', 'Configure'),
					mainMenu.button('import', 'fa-upload', 'Import Geometry'),
					mainMenu.button('params', 'fa-sliders', 'Parameters'),
					mainMenu.button('property-inspector', 'fa-info-circle', 'Property Inspector'),
					mainMenu.button('global-settings', 'fa-cogs', 'Settings'),

				]
			},
			{
				tag: 'ul',
				className: 'menu-button-list-bottom',
				children: [
					mainMenu.button('settings', 'fa-cog', 'Settings'),
				]
			}
		]
	});

	document.body.appendChild(state.mainMenu);

	const sideMenu = new SideMenu();
	state.sideMenu = sideMenu.root;

	const paramView = new View('Parameters', 'params', 'fa-sliders');
	sideMenu.addView(paramView);

	const propertyInspectorView = new View("Property Inspector", 'property-inspector', 'fa-info-circle');
	sideMenu.addView(propertyInspectorView);

	const globalSettingsView = new View("Settings", "global-settings", 'fa-cogs');
	sideMenu.addView(globalSettingsView);




	state.renderer.camera

	globalSettingsView.testtime(/* html */`
<div class="side-menu-content-subsection">
	<div class="side-menu-content-subsection-header section-indent-0_5">
		Global Settings
	</div>
		<div class="side-menu-content-subsection-header">
			Renderer
		</div>
		<div class="labeled-checkbox">
			<label position="left">
				Ortho
				<input type="checkbox">
			</label>
		</div>
		<div class="labeled-dropdown">
			<label position="left">
				Device Type
				<select>
					<option>Trackpad</option>
					<option>Mouse</option>
				</select>
			</label>
		</div>
		<div class="labeled-dropdown">
			<label position="left">
				Orbit Style
				<select>
					<option>Blender</option>
				</select>
			</label>
		</div>
	</div>
	`);

	sideMenu.setView('global-settings');

	[
		"property-inspector",
		"params",
		"global-settings"
	].forEach(x => {
		mainMenu.buttons[x].addEventListener('click', e => {
			sideMenu.setView(x)
		})
	})



	const content_content = state.sideMenu.querySelector('.side-menu-content-content');
	content_content.setAttribute('style', 'transform:translateY(0px);');
	content_content.addEventListener('mousewheel', e => {

		const translation = Number(content_content.getAttribute('style').replace(/transform\:translateY\(|px\)\;/gmi, '')) - e.deltaY;
		console.log(translation);
		content_content.setAttribute('style', `transform:translateY(${clamp(translation, -content_content.clientHeight + window.innerHeight*.8, 0.0)}px);`);

	})


	state.sideMenu.querySelector('.side-menu-drag-handle').addEventListener('mousedown', e => {
		// (e.target as HTMLDivElement).setAttribute('state', 'grabbed');
		state.sideMenu.setAttribute('moving', 'true');
		console.log(state.sideMenu);
		state.grabTarget = state.sideMenu;
		state.grabPoint = {
			//@ts-ignore
			x: e.clientX,
			//@ts-ignore
			y: e.clientY
		};
	})

	window.addEventListener('mouseup', e => {
		state.sideMenu.setAttribute('moving', 'false');
		if (state.grabTarget) {
			// state.grabTarget.setAttribute('deltax', e.clientX - state.grabPoint.x);
			state.grabTarget = undefined;
		}
	})

	window.addEventListener('mousemove', e => {

		// console.log(state.previousMouse);
		state.mouse = {
			x: e.clientX,
			y: e.clientY
		};
		const temp = state.mouse;
		const dx = state.mouse.x - (state.previousMouse.x || state.mouse.x);
		const dy = state.mouse.y - (state.previousMouse.y || state.mouse.y);

		if (state.grabTarget) {
			const newWidth = Number(state.grabTarget.getAttribute('style').replace(/width\:|px/gmi, '')) - dx;
			state.grabTarget.setAttribute('style', `width:${clamp(newWidth,100,window.innerWidth)}px`);
		}
		state.previousMouse = {
			x: temp.x,
			y: temp.y
		}

})




	state.settingsWindow = new ModalWindow("Settings");



	// state.settingsWindow.toggleVisibility();
	state.settingsWindow.checkbox("Vertex Normals", "vertex-normals-checkbox", "", true).addEventListener('change', e => {
		state.renderer.toggleVertexNormals((e.target as HTMLInputElement).checked);
	})

	state.settingsWindow.checkbox("Greyscale Surface Color", "greyscale-surface-color", "", false).addEventListener('change', e => {
		state.renderer.toggleGreyscaleSurfaceColor((e.target as HTMLInputElement).checked);
	})


	state.settingsWindow.slider("Focal Length", "focal-length", "", 1, 180, .5).addEventListener('input', e => {
		(state.renderer.camera as THREE.PerspectiveCamera).setFocalLength(Number((e.target as HTMLInputElement).value));
	})

	mainMenu.buttons['add-source'].addEventListener('click', e => {
		state.renderer.addSource(new Source({
			pos: new vec3(2, 2, 2),
			col: new vec4(0.314, 0.779, 0.497, 0.7),
			radius: .1,
			name: ''
		}))
	});


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

	mainMenu.buttons['start-stop-trace'].addEventListener('click', e => {

		if ((e.target as HTMLElement).classList.contains('fa-play')) {
			(e.target as HTMLElement).classList.replace('fa-play', 'fa-pause')
			state.renderer.startAllMonteCarlo();
		}
		else {
			(e.target as HTMLElement).classList.replace('fa-pause', 'fa-play')
			state.renderer.stopAllMonteCarlo();
		}
		// state.renderer.startMonteCarlo()
	})


	mainMenu.buttons['settings'].addEventListener('click', e => {
		state.settingsWindow.toggleVisibility();
	})


	// state.renderer.
//==============================================================================================

	let defaultgeom = 'res/pitch.obj';

	const geomarr = await state.renderer.addGeometry(defaultgeom);
	// state.beamtracer = new BeamTracer({
	// 	geometry: geomarr as BufferGeometry[],
	// 	sources: [new Source({
	// 		pos: new vec3(2, 2, 2),
	// 		col: new vec4(0.5, 4.0, 0.3, 0.7),
	// 		radius: .1,
	// 		name: 'main_source'
	// 	})],
	// 	receivers: [new Receiver({
	// 		pos: new vec3(-2, 2, 2),
	// 		col: new vec4(4.0, 0.5, 0.3, 0.7),
	// 		radius: .1,
	// 		name: 'main_receiver'
	// 	})]
	// });

	state.renderer.setSurfacePhysicalMaterial({ metalness: 0.8, transparent: true, opacity: 0.15, color: 0x000000, side: THREE.DoubleSide })
	// console.log(state.beamtracer);

	// state.renderer.addSourcesAndReceivers([new Source({
	// 		pos: new vec3(2, 2, 2),
	// 		col: new vec4(0.5, 4.0, 0.3, 0.7),
	// 		radius: .1,
	// 		name: 'main_source'
	// })], [new Receiver({
	// 		pos: new vec3(-2, 2, 2),
	// 		col: new vec4(4.0, 0.5, 0.3, 0.7),
	// 		radius: .1,
	// 		name: 'main_receiver'
	// 	})]);

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
				// state.beamtracer.sources[0].posarr = state.renderer.sourcesAndReceivers.getObjectByName('main_source').position.toArray()
				//@ts-ignore
				// state.beamtracer.receivers[0].posarr = state.renderer.sourcesAndReceivers.getObjectByName('main_receiver').position.toArray()


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

	// state.renderer.showReflections = true;
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
