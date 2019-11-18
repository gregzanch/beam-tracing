import { MainMenu, SideMenu, View } from './user-interface';

import { BeamTracer } from './lib/beam-tracer';
import { Renderer } from './renderer/renderer';
import { DoubleClickTimer } from './double-click-timer';

import * as THREE from 'three';
import { clamp } from './lib/math/math';
// import { sizeof, sizeof_object } from './sizeof';
// import { Parameter } from './parameter';


// Object.assign(window, { sizeof, sizeof_object });



import './scss/nav.scss';
import './scss/main.scss';
import './scss/user-interface.scss';
import './scss/modal-window.scss';
import './scss/side-menu.scss';
import './scss/info-div.scss';
import './scss/iconset-v1.0/style.css';

import { TargetedInputEvent } from './renderer/event';



// import { DeviceQueryAlert } from './device-query-alert'



// // console.log(dqa);
let domlayer: HTMLDivElement = document.createElement('div');
domlayer.setAttribute('id', 'dom-layer');
domlayer.setAttribute('class', 'dom-layer');
document.body.appendChild(domlayer);


function storeifndef(id: string, value: any) {
	const val = localStorage.getItem(id);
	if (!val) {
		store(id,value)
		return value
	}
	else {
		console.log(val);
		return JSON.parse(val);
	}
}
function store(id: string, value: any) {
	localStorage.setItem(id, JSON.stringify(value));
	const str = `setting ${id} to ${value}`;
	console.log(str);
}


interface Point {
	x: number;
	y: number;
}

interface State {
	renderer: Renderer;
	beamtracer: BeamTracer;
	shouldUpdate: boolean;
	mainMenu;
	sideMenu;
	monteCarloInterval: number;
	monteCarloReflectionOrder: number;
	grabTarget;
	grabPoint: Point;
	mouse: Point;
	previousMouse: Point;

}

const state: State = {
	shouldUpdate: false,
	monteCarloInterval: 100,
	monteCarloReflectionOrder: 25,
} as State;

async function main() {
	state.renderer = new Renderer({
		cameraPos: new THREE.Vector3(-41., 20., 35),
		cameraRot: new THREE.Euler(-0.4, -1.0, -0.33, "XYZ")
	});

	Object.assign(window, { state });


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
					mainMenu.button('add-source', 'icon-feed', 'Add Source'),
					mainMenu.button('add-reciever', 'icon-headphones', 'Add Reciever'),
					mainMenu.button('import', 'fa-upload', 'Import Geometry'),
					mainMenu.seperator(),
					mainMenu.button('objects', "fa-folder-open", 'Objects'),
					mainMenu.button('geometry', "fa-codepen", 'Geometry'),
					mainMenu.seperator(),
					mainMenu.button('renderer-settings', 'fa-cogs', 'Renderer Settings'),
					mainMenu.button('params', 'fa-sliders', 'Parameters'),
					mainMenu.button('configure', 'fa-wrench', 'Configure'),
				]
			},
			{
				tag: 'ul',
				className: 'menu-button-list-bottom',
				children: [
					mainMenu.button('debug', 'fa-bug', 'Debug'),
				
				]
			}
		]
	});

	document.body.appendChild(state.mainMenu);

	const sideMenu = new SideMenu();
	state.sideMenu = sideMenu;


	const GeometryView = new View("Geometry", "geometry", "fa-codepen");
	sideMenu.addView(GeometryView);
	state.renderer.setGeometryView(GeometryView);

	const ObjectsView = new View("Objects", "objects", "fa-folder-open");
	sideMenu.addView(ObjectsView);
	state.renderer.setObjectsView(ObjectsView);


	

	// RendererSettingsView holds the parameters for the renderer
	const RendererSettingsView = new View("Renderer Settings", "renderer-settings", 'fa-cogs');
	{
		sideMenu.addView(RendererSettingsView);
		RendererSettingsView
			
			.checkbox({
				id: 'render-lines',
				label: 'Render Lines',
				desc: 'should lines be renderered',
				checked: storeifndef('render-lines', true)
			})
			.listen('change', (e: TargetedInputEvent) => {
				state.renderer.addLines = (e.target as HTMLInputElement).checked;
				store('render-lines', e.target.checked);
			})


			.checkbox({
				id: 'vertex-normals',
				label: 'Vertex Normals',
				desc: '',
				checked: storeifndef('vertex-normals', state.renderer.room.normalsHelper.visible)
			})
			.listen('change', (e: TargetedInputEvent) => {
				state.renderer.toggleVertexNormals(e.target.checked);
				store('vertex-normals', e.target.checked)
			})
			
			
			.checkbox({
				id: 'ortho-button',
				label: 'Orthographic Projection',
				desc: '',
				checked: storeifndef('ortho-button', false)
			})
			.listen('change', (e: TargetedInputEvent) => {
				state.renderer.setOrthographicCamera(e.target.checked);
				store('ortho-button', e.target.checked);
			})

			
			.checkbox({
				id: 'trackpad-button',
				label: 'Trackpad',
				desc: '',
				checked: storeifndef('trackpad-button', false)
			})
			.listen('change', (e: TargetedInputEvent) => {
				state.renderer.setTrackPad(e.target.checked);
				store('trackpad-button', e.target.checked)
			})
			
			
			.color({
				id: 'background-color',
				label: 'Background Color',
				desc: 'The color of the scene\'s fog',
				value: storeifndef('background-color', '#c0c0c0')
			})
			.listen('input', (e: TargetedInputEvent) => {
				const value = e.target.value;
				const other = e.target.getAttribute("other");
				(RendererSettingsView.inputs[other] as HTMLInputElement).value = value;
				state.renderer.setBackground(value);
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('background-color', e.target.value)
			}, [1, 2])
			
			
			.color({
				id: 'fog-color',
				label: 'Fog Color',
				desc: 'The color of the scene\'s fog',
				value: storeifndef('fog-color', '#ffffff')
			})
			.listen('input', (e: TargetedInputEvent) => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute("other");
				(RendererSettingsView.inputs[other] as HTMLInputElement).value = value;
				state.renderer.setFogColor(value);
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('fog-color', e.target.value)
			}, [1, 2])
			
			
			.slider({
				id: 'fog-amount',
				label: 'Fog Amount',
				desc: '',
				min: 0,
				max: 0.003,
				step: 0.00003,
				value: storeifndef('fog-amount', 0.0015)
			})
			.listen('input', e => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute('other');
				(RendererSettingsView.inputs[other] as HTMLInputElement).value = value;
				state.renderer.setFog(Number(value));
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('fog-amount', e.target.valueAsNumber);
			}, [1, 2])
			
			
			.slider({
				id: 'focal-length',
				label: 'Focal Length',
				desc: '',
				min: 10,
				max: 75,
				step: .5,
				value: storeifndef('focal-length', 35)
			})
			.listen('input', e => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute('other');
				(RendererSettingsView.inputs[other] as HTMLInputElement).value = value;

				if (state.renderer.camera instanceof THREE.PerspectiveCamera) {
					state.renderer.camera.setFocalLength(Number(value));
				}
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('focal-length', e.target.valueAsNumber)
			}, [1, 2])
			
			
			.slider({
				id: 'near-clip',
				label: 'Near Clip',
				desc: 'How close the camera gets to an object before it begins to clip',
				min: 0.1,
				max: 10,
				step: 0.01,
				value: storeifndef('near-clip', 0.1)
			})
			.listen('input', e => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute('other');
				state.renderer.camera.near = (Number(value));
				(RendererSettingsView.inputs[other] as HTMLInputElement).value = value;
				state.renderer.camera.updateProjectionMatrix();
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('near-clip', e.target.valueAsNumber)
			}, [1, 2])

			
			
			.slider({
				id: 'far-clip',
				label: 'Far Clip',
				desc: 'The distance the camera sees',
				min: 10,
				max: 10000,
				step: 1,
				value: storeifndef('far-clip', 1000)
			})
			.listen('input', e => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute('other');
				state.renderer.camera.far = (Number(value));
				(RendererSettingsView.inputs[other] as HTMLInputElement).value = value;
				state.renderer.camera.updateProjectionMatrix();
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('far-clip', e.target.valueAsNumber)
			}, [1, 2])
		
		
		/**
		 * iterate over the inputs in RendererSettingsView and dispatch an input event in order to
		 * trigger their event handlers, which changes the corresponding parameter in the renderer
		 */
		for (const input in RendererSettingsView.inputs) {
			RendererSettingsView.inputs[input].dispatchEvent(new Event('input'));
		}
	}

	const ConfigureView = new View("Configure", "configure", "fa-wrench");
	{
		sideMenu.addView(ConfigureView);
	}

	const ParamView = new View('Parameters', 'params', 'fa-sliders');
	{
		sideMenu.addView(ParamView);
		ParamView
			.slider({
				id: 'update-interval',
				label: 'Update Interval',
				desc: 'The time between successive raytrace function calls',
				min: 1,
				max: 1000,
				step: 1,
				value: storeifndef('update-interval', 100)
			})
			.listen('input', e => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute('other');
				state.monteCarloInterval = (Number(value));
				(ParamView.inputs[other] as HTMLInputElement).value = value;
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('update-interval', e.target.valueAsNumber)
			})


			.slider({
				id: 'reflection-order',
				label: 'Reflection Order',
				desc: 'The number of bounces per ray',
				min: 1,
				max: 100,
				step: 1,
				value: storeifndef('update-interval', 25)
			})
			.listen('input', e => {
				const value = (e.target as HTMLInputElement).value;
				const other = (e.target as HTMLInputElement).getAttribute('other');
				state.monteCarloReflectionOrder = (Number(value));
				(ParamView.inputs[other] as HTMLInputElement).value = value;
			}, [1, 2])
			.listen('change', (e: TargetedInputEvent) => {
				store('reflection-order', e.target.valueAsNumber)
			})
	}

	for (const view in sideMenu.views) {
		mainMenu.buttons[view].addEventListener('click', e => {
			state.sideMenu.setView(view);
			state.sideMenu.saveState();
		})
	}

	sideMenu.restoreState();

	const content_content = state.sideMenu.root.querySelector('.side-menu-content-content');
	content_content.setAttribute('style', 'transform:translateY(0px);');
	content_content.addEventListener('mousewheel', e => {
		const translation = Number(content_content.getAttribute('style').replace(/transform\:translateY\(|px\)\;/gmi, '')) - e.deltaY;

		content_content.setAttribute('style', `transform:translateY(${clamp(translation, -content_content.clientHeight + window.innerHeight*.8, 0.0)}px);`);
	})


	const doubleClickTimer = new DoubleClickTimer(state.sideMenu.root.querySelector('.side-menu-drag-handle'), 300, (e, dt) => {
		sideMenu.collapse();
	});



	state.sideMenu.root.querySelector('.side-menu-drag-handle').addEventListener('mousedown', e => {
		// (e.target as HTMLDivElement).setAttribute('state', 'grabbed');
		state.sideMenu.root.setAttribute('moving', 'true');

		state.grabTarget = state.sideMenu.root;
		state.grabPoint = {
			//@ts-ignore
			x: e.clientX,
			//@ts-ignore
			y: e.clientY
		};
	})


	window.addEventListener('mouseup', e => {
		state.sideMenu.root.setAttribute('moving', 'false');
		if (state.grabTarget) {
			// state.grabTarget.setAttribute('deltax', e.clientX - state.grabPoint.x);
			state.grabTarget = undefined;
		}
		state.sideMenu.saveState();
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

	mainMenu.buttons['select'].addEventListener('click', e => {
		state.renderer.startProcess("select_surface")
	})


	mainMenu.buttons['add-source'].addEventListener('click', e => {
		state.renderer.addSource(new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, 0, 0));
	});

	mainMenu.buttons['add-reciever'].addEventListener('click', e => {
		state.renderer.addReceiver(new THREE.Vector3(0, 2, 0));
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
			if (file) {
				const url = URL.createObjectURL(file);
				const geomarr = await state.renderer.addGeometry(url, file.type || file.name.split('.').slice(-1)[0]);
				updateGeometryView(state.renderer.room.solid.children as THREE.Mesh[])
			}
			inp.remove();
		});
		inp.click();
	})

	mainMenu.buttons['start-stop-trace'].addEventListener('click', e => {
		if (state.renderer.readyToStart()) {
			if ((e.target as HTMLElement).classList.contains('fa-play')) {
				(e.target as HTMLElement).classList.replace('fa-play', 'fa-pause')
				// state.renderer.startAllMonteCarlo(state.monteCarloReflectionOrder, state.monteCarloInterval);
				state.renderer.startAllSourcesByTransferFunction(state.monteCarloReflectionOrder, state.monteCarloInterval);
			}
			else {
				(e.target as HTMLElement).classList.replace('fa-pause', 'fa-play')
				state.renderer.stopAllMonteCarlo();
			}
		}
		else {
			
		}
	})


	

//==============================================================================================

	let defaultgeom = 'res/s.obj';
	const geomarr = await state.renderer.addGeometry(defaultgeom);
	// updateGeometryView(state.renderer.room.solid.children as THREE.Mesh[])
	// state.renderer.room.solid.children[8].userData.alpha = 0.5;
	// state.renderer.room.solid.children[7].userData.alpha = 0.8;
	state.renderer.addSource(new THREE.Vector3(-15, 2, 8), new THREE.Vector3(0, 0, 0), "Loudspeaker");
	state.renderer.addReceiver(new THREE.Vector3(0, 6, 0), {
		Rd: new THREE.Vector3(0, 0, 0),
		name: "Listener",
		radius: 5
	});

	function dragChangedCallback(event) {
		state.shouldUpdate = Boolean(event.value);

	}
	function updateCallback(time) {
		if (state.shouldUpdate) { }
	}



	state.renderer.attachUpdateCallback(updateCallback);
	state.renderer.attachDragChangedCallback(dragChangedCallback);


	// sideMenu.setView(GeometryView);

	function updateGeometryView(surfaces: THREE.Mesh[]) {

		surfaces.forEach(surface => {
			console.log(surface);
		})
	}

	// state.renderer.shouldRender = false;


}

main();
