
import { EventManager } from './../events/eventManager';
import { reflectionCoefficient } from '../lib/acoustics/reflection-coefficient';
import { DomBugger } from './dombugger';
import * as THREE from 'three';
import { OrbitControls } from './orbit-controls';
import { TransformControls } from './transform-controls.js';
import { map, max, min, clamp, norm, reflect, triangleArea } from '../lib/math/math';
import { PickHelper } from './pick-helper';
import hotkeys from 'hotkeys-js';
import { Source } from '../lib/source';
import { Receiver } from '../lib/receiver';
const Emitter = require('tiny-emitter');

const STLLoader = require('three-stl-loader')(THREE);
import OBJLoader from '../lib/parsers/obj';
import { SphereBufferGeometry, HemisphereLight, Geometry } from 'three';
import { type } from 'os';


OBJLoader(THREE);
const GLTFLoader = require('three-gltf-loader')
const ColladaLoader = require('three-collada-loader');

const edges = require('./edges.js');

export interface RoomGroup{
	solid: THREE.Group;
	wire: THREE.Group;
	edge: THREE.Group;
	surfaces: Array<any>,
	normalsHelper: THREE.Group;
}

//@ts-ignore
window.THREE = THREE;



interface RendererParams{
	cameraPos?: THREE.Vector3;
	cameraRot?: THREE.Euler;
}

export interface IndexedObject<T>{
	[id: string]: T
}



export class Renderer {
	loaders: {};

	orbitControls;
	transformControls;
	camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
	orthocamera: THREE.OrthographicCamera;
	isCameraOrtho: boolean = false;

	processes;
	currentProcess;

	modes;
	modeState: string = "base";

	renderer: THREE.WebGLRenderer;
	scene: THREE.Scene;
	canvas: HTMLCanvasElement;

	lighting: THREE.Group;
	room: RoomGroup;

	helpers: THREE.Group;

	fov: number = 20;
	hoverOpacity: number = 0.5;
	regularOpacity: number = 0.3;
	aspect: number = window.innerWidth / window.innerHeight;
	near: number = 0.1;
	far: number = 1000;

	renderRequested: any = undefined;

	pickPosition: { x: number, y: number } = { x: 0, y: 0 }
	pickHelper: PickHelper = new PickHelper(this.regularOpacity, this.hoverOpacity, false, false);

	sourcesAndReceivers: THREE.Group;
	sources: THREE.Group;
	receivers: THREE.Group;

	points: THREE.Group;
	beams: THREE.Group;

	updateCallbacks: [];
	dragChangedCallbacks: [];

	dombugger: DomBugger;

	showReflections: boolean;

	easeCameraTarget;
	easeCameraFocus;
	easeCameraSteps;
	easeCameraCallback;
	easeCameraDelta;
	easeCameraDeltaRotation;
	easeCameraTargetDelta;
	easingCamera;
	easeCameraCurrentFocus;

	quatHelper: THREE.Group;
	misclines: THREE.Group;
	constructorParams: RendererParams;

	_eventManager: EventManager;

	gridSize: number;
	gridDivisions: number;
	gridHelper: THREE.GridHelper;

	monteCarloIntervalIds: IndexedObject<boolean>;

	rays: THREE.Group;

	trackPad: boolean;

	constructor(params: RendererParams) {
		this.modes = {
			selectingGeometry: false
		};
		this.constructorParams = params;
		this.setup = this.setup.bind(this);
		this.render = this.render.bind(this);
		this.update = this.update.bind(this);
		this.animate = this.animate.bind(this);
		this.onResize = this.onResize.bind(this);
		this.setupHelpers = this.setupHelpers.bind(this);
		this.setupLoaders = this.setupLoaders.bind(this);
		this.setupEventListeners = this.setupEventListeners.bind(this);
		this.setupOrbitControls = this.setupOrbitControls.bind(this);
		this.setupLighting = this.setupLighting.bind(this);
		this.setupRoom = this.setupRoom.bind(this);
		this.setupScene = this.setupScene.bind(this);
		this.setupCamera = this.setupCamera.bind(this);
		this.setupRenderer = this.setupRenderer.bind(this);
		this.resizeRendererToDisplaySize = this.resizeRendererToDisplaySize.bind(this);
		this.requestRenderIfNotRequested = this.requestRenderIfNotRequested.bind(this);
		this.addGeometry = this.addGeometry.bind(this);
		this.OBJHandler = this.OBJHandler.bind(this);
		this.STLHandler = this.STLHandler.bind(this);
		this.GLTFHandler = this.GLTFHandler.bind(this);
		this.ColladaHandler = this.ColladaHandler.bind(this);
		this.setPickPosition = this.setPickPosition.bind(this);
		this.clearPickPosition = this.clearPickPosition.bind(this);
		this.mouseDownHandler = this.mouseDownHandler.bind(this);
		this.touchMoveHandler = this.touchMoveHandler.bind(this);
		this.touchStartHandler = this.touchStartHandler.bind(this);
		this.getCanvasRelativePosition = this.getCanvasRelativePosition.bind(this);
		this.getDistanceFromTarget = this.getDistanceFromTarget.bind(this);
		this.setupHotKeys = this.setupHotKeys.bind(this);
		this.toggleOrthographicCamera = this.toggleOrthographicCamera.bind(this);
		this.setupProcesses = this.setupProcesses.bind(this);
		this.setupSourcesAndReceivers = this.setupSourcesAndReceivers.bind(this);
		this.setupCallbacks = this.setupCallbacks.bind(this);
		this.setupBeams = this.setupBeams.bind(this);
		this.setupPoints = this.setupPoints.bind(this);
		this.updateBeams = this.updateBeams.bind(this);
		this.updatePoints = this.updatePoints.bind(this);
		this.addPoint = this.addPoint.bind(this);
		this.dragChanged = this.dragChanged.bind(this);
		this.setupTransformControls = this.setupTransformControls.bind(this);
		this.attachUpdateCallback = this.attachUpdateCallback.bind(this);
		this.attachDragChangedCallback = this.attachDragChangedCallback.bind(this);
		this.exitAllProcesses = this.exitAllProcesses.bind(this);
		this.finishCurrentProcess = this.finishCurrentProcess.bind(this);
		this.setupDomBugger = this.setupDomBugger.bind(this);
		this.lookAtSurface = this.lookAtSurface.bind(this);
		this.setupEaseCamera = this.setupEaseCamera.bind(this);
		this.easeCameraTo = this.easeCameraTo.bind(this);
		this.setupQuatHelper = this.setupQuatHelper.bind(this);
		this.addQuatHelper = this.addQuatHelper.bind(this);
		this.mouseupHandler = this.mouseupHandler.bind(this);
		this.toggleVertexNormals = this.toggleVertexNormals.bind(this);
		this.toggleGreyscaleSurfaceColor = this.toggleGreyscaleSurfaceColor.bind(this);
		this.addLine = this.addLine.bind(this);
		this.stopMonteCarlo = this.stopMonteCarlo.bind(this);
		this.startMonteCarlo = this.startMonteCarlo.bind(this);
		this.traceRay = this.traceRay.bind(this);
		this.setTrackPad = this.setTrackPad.bind(this);
		this.setupRays = this.setupRays.bind(this);
		this.setupMonteCarlo = this.setupMonteCarlo.bind(this);
		this.startAllMonteCarlo = this.startAllMonteCarlo.bind(this);
		this.Float32BufferAttributeToTriangles = this.Float32BufferAttributeToTriangles.bind(this);
		this.calculateSurfaceArea = this.calculateSurfaceArea.bind(this);
		this.setup();
		this.setTrackPad(false);
		this.animate();
		// this.update();
		// this.render();
		//@ts-ignore
		window.r = this;

	}
	setup() {
		this.setupRenderer();
		this.setupCamera();
		this.setupOrbitControls();
		this.setupScene();
		this.setupRoom();
		this.setupLighting();

		this.setupProcesses();
		this.setupEventListeners();
		this.setupHotKeys();
		this.setupLoaders();
		this.setupHelpers();
		this.setupSourcesAndReceivers();
		this.setupCallbacks();
		this.setupTransformControls();
		this.setupBeams(6000);
		this.setupPoints(6000);
		this.setupRays(6000);
		this.setupDomBugger();
		this.setupQuatHelper();
		this.setupMonteCarlo();
		this.render();
	}

	setupQuatHelper() {
		this.quatHelper = new THREE.Group()
		this.scene.add(this.quatHelper);
	}
	setupEaseCamera() {
		this.easingCamera = false;
	}
	setupDomBugger() {
		let container = document.createElement('div');
		container.setAttribute('class', 'dombugger-container');
		document.body.appendChild(container);
		this.dombugger = new DomBugger(document.querySelector('.dombugger-container'));
		// this.dombugger.watch('random', 1000, () => Math.random());
	}
	setupTransformControls() {
		this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
		this.transformControls.addEventListener('change', this.render);
		this.transformControls.addEventListener('dragging-changed', this.dragChanged);
		this.scene.add(this.transformControls);
	}
	setupCallbacks() {
		this.updateCallbacks = [];
		this.dragChangedCallbacks = [];
	}
	setupSourcesAndReceivers() {
		// this.sources = new THREE.Group();
		// this.sources.name = "sources";
		// this.sources.userData = {
		// 	selectable: true
		// }
		// this.receivers = new THREE.Group();
		// this.receivers.name = "sources";
		// this.receivers.userData = {
		// 	selectable: true
		// }
		this.sourcesAndReceivers = new THREE.Group();
		this.scene.add(this.sourcesAndReceivers);
	}
	setupProcesses() {
		this.currentProcess = "base";
	}
	toggleOrthographicCamera() {
		this.setOrthographicCamera(!this.isCameraOrtho);
	}
	startProcess(proc) {
		this.exitAllProcesses();
		this.currentProcess = proc;
	}
	setupHotKeys() {
		hotkeys('f','base', ()=>this.startProcess('select_surface'))
		hotkeys('o', 'base', this.toggleOrthographicCamera);
		hotkeys('l', 'base', ()=>this.startProcess('lookat'));
		hotkeys('esc', 'all', this.exitAllProcesses);
		hotkeys('enter', 'all', this.finishCurrentProcess);
		hotkeys.setScope('base');

	}
	exitAllProcesses() {
		if (this.transformControls) {
			// const previousPosition = this.transformControls.object.userData.previousPosition;
			// this.transformControls.object.position.set(previousPosition.x, previousPosition.y, previousPosition.z);
			// // console.log(previousPosition);
			this.transformControls.detach();
			this.transformControls.enabled = false;
		}
		this.currentProcess = "base";
	}
	finishCurrentProcess() {
		if (this.transformControls) {
			this.transformControls.detach();
			this.transformControls.enabled = false;
		}
		this.currentProcess = "base";
	}
	touchStartHandler(event) {
		// event.preventDefault();
		// this.setPickPosition(event.touches[0]);
	}
	touchMoveHandler(event) {
		// this.setPickPosition(event.touches[0]);
	}
	getCanvasRelativePosition(event) {
		const rect = this.canvas.getBoundingClientRect();
		return {
			x: event.clientX - rect.left,
			y: event.clientY - rect.top,
		};
	}
	setPickPosition(event) {
		const pos = this.getCanvasRelativePosition(event);
		this.pickPosition.x = (pos.x / this.canvas.clientWidth) * 2 - 1;
		this.pickPosition.y = (pos.y / this.canvas.clientHeight) * -2 + 1;  // note we flip Y
	}
	clearPickPosition() {

		this.pickPosition.x = -100000;
		this.pickPosition.y = -100000;
	}
	dragChanged(event) {

		this.orbitControls.enabled = !event.value;
		//@ts-ignore
		this.dragChangedCallbacks.forEach(x => x(event));
	}
	attachDragChangedCallback(cb) {
		//@ts-ignore
		this.dragChangedCallbacks.push(cb);
	}
	attachUpdateCallback(cb) {
		//@ts-ignore
		this.updateCallbacks.push(cb);
	}
	setupHelpers() {
		this.helpers = new THREE.Group();
		this.helpers.name = "helpers";
		this.helpers.userData = {
			kind: "helpers",
			selectable: false
		};

		var axialHelper = new THREE.Group();
		axialHelper.name = "axialHelper"
		axialHelper.add(
			this.makeLine(-1000, 0, 0, 1000, 0, 0, 0xff0000),
			this.makeLine(0, -1000, 0, 0, 1000, 0, 0x00ff00),
			this.makeLine(0, 0, -1000, 0, 0, 1000, 0x0000ff)
		);
		this.helpers.add(axialHelper);

		this.gridSize = 1000;
		this.gridDivisions = 250;
		this.gridHelper = new THREE.GridHelper(this.gridSize, this.gridDivisions);
		const material = (this.gridHelper.material as THREE.LineBasicMaterial);
		material.transparent = true;
		material.opacity = 0.2;
		material.color.setRGB(0, 0, 0);
		this.helpers.add(this.gridHelper);

		this.scene.add(this.helpers);

	}
	toggleVertexNormals(visibility?) {
		if (this.room && this.room.normalsHelper) {
			this.room.normalsHelper.visible = typeof visibility !== "undefined" ? visibility : !this.room.normalsHelper.visible;
		}
	}
	setSurfacePhysicalMaterial(params){
		if (this.room && this.room.solid) {
			console.log(this.room.solid);
			this.room.solid.children.forEach((mesh: THREE.Mesh) => {
				(mesh.material as THREE.Material) = new THREE.MeshPhysicalMaterial(params)
			});
		}
	}
	setSurfaceColor(r, g, b, a) {
		if (this.room && this.room.solid) {
			console.log(this.room.solid);
			this.room.solid.children.forEach((mesh: THREE.Mesh) => {
				(mesh.material as THREE.Material) = new THREE.MeshPhysicalMaterial({

					metalness: 0.2,
					transparent: true,
					opacity: (typeof b === typeof a && typeof a === "undefined") ? g : a,
					color: (typeof b === typeof a && typeof a === "undefined") ? new THREE.Color(r, r, r) : new THREE.Color(r, g, b),
					side: THREE.DoubleSide,
				})
			});
		}
	}
	toggleGreyscaleSurfaceColor(tf=false) {
		if (this.room && this.room.solid) {
			console.log(this.room.solid);
			if (typeof tf !== "undefined") {
				if (!tf) {
					this.room.solid.children.forEach((mesh: THREE.Mesh) => {
						(mesh.material as THREE.Material) = new THREE.MeshNormalMaterial({
							transparent: true,
							opacity: this.regularOpacity,
							side: THREE.DoubleSide
						})
					})
				}
				if (tf) {
					this.room.solid.children.forEach((mesh: THREE.Mesh) => {
						(mesh.material as THREE.Material) = new THREE.MeshPhysicalMaterial({
							transparent: true,
							opacity: this.regularOpacity,
							color: 0x101010,
							side: THREE.DoubleSide,
						})
					})
				}
			}

		}
	}

	makeLine(x1, y1, z1, x2, y2, z2, color=0x000000, opacity=0.3, userData = {}) {
		var linegeom = new THREE.BufferGeometry();
		linegeom.addAttribute('position', new THREE.BufferAttribute(new Float32Array([x1, y1, z1, x2, y2, z2]), 3, false));
		var line = new THREE.Line(linegeom, new THREE.LineBasicMaterial({
			color: color,
			transparent: true,
			opacity: opacity
		}));
		line.userData = userData;
		return line;
	}
	setupLoaders() {
		this.loaders = {
			'stl': {
				loader: STLLoader,
				handler: this.STLHandler
			},
			'obj': {
				//@ts-ignore
				loader: THREE.OBJLoader,
				handler: this.OBJHandler
			},
			'gltf': {
				loader: GLTFLoader,
				handler: this.GLTFHandler
			},
			'dae': {
				loader: ColladaLoader,
				handler: this.ColladaHandler
			}
		}
	}
	setupEventListeners() {
		// this.orbitControls.addEventListener('change', this.requestRenderIfNotRequested);
		this.canvas.addEventListener('mousemove', this.setPickPosition);
		this.canvas.addEventListener('mouseout', this.clearPickPosition);
		this.canvas.addEventListener('mouseup', this.mouseupHandler);
		this.canvas.addEventListener('mouseleave', this.clearPickPosition);
		this.canvas.addEventListener('mousedown', this.mouseDownHandler);
		this.canvas.addEventListener('touchstart', this.touchStartHandler, { passive: false });
		this.canvas.addEventListener('touchmove', this.touchMoveHandler);
		this.canvas.addEventListener('touchend', this.clearPickPosition);
		window.addEventListener('resize', this.onResize, false);
	}
	mouseupHandler(e) {
		window.localStorage.setItem('cameraState', JSON.stringify(this.getCameraState()))
	}
	setupOrbitControls() {
		this.orbitControls = new OrbitControls(this.camera, this.canvas);
		this.orbitControls.target.set(0, 0, 0);
		this.orbitControls.update();
	}
	setupLighting() {
		this.lighting = new THREE.Group();
		// this.lighting.add();
		const hemisphere = new THREE.HemisphereLight(0xffffff, 0x020202, 100);
		this.lighting.add(hemisphere);
		this.lighting.add(this.makeDirectionalLight({
			x: -1,
			y: 2,
			z: 4
		}));
		this.lighting.add(this.makeDirectionalLight({
			x: -1,
			y: -1,
			z: -2
		}));
		this.scene.add(this.lighting);
	}
	setupRoom() {
		this.room = {
			solid: new THREE.Group(),
			wire: new THREE.Group(),
			edge: new THREE.Group(),
			normalsHelper: new THREE.Group(),
			surfaces: []
		}
		this.scene.add(this.room.solid, this.room.wire, this.room.edge, this.room.normalsHelper);
	}

	setupScene() {
		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(0xffffff, 0.0055);

		this.scene.background = new THREE.Color(0xf0f0f0);

	}
	setupCamera() {
		this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);

		if (this.constructorParams.cameraRot) {
			const { x, y, z, order } = this.constructorParams.cameraRot;
			this.camera.rotation.set(x, y, z, order);
		}
		else {
			this.camera.rotation.set(-.2, 0, 0);
		}
		if (this.constructorParams.cameraPos) {
			const { x, y, z } = this.constructorParams.cameraPos;
			this.camera.position.set(x, y, z);
		}
		else {
			this.camera.position.set(0, 12, 32);
		}
		if (window.localStorage.getItem('cameraState')) {
			this.setCameraState(JSON.parse(window.localStorage.getItem('cameraState')))
		}
	}
	setupRenderer() {
		this.renderer = new THREE.WebGLRenderer({
			antialias: true,

		})
		this.renderer.setPixelRatio(window.devicePixelRatio);
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		document.querySelector('#gl').appendChild(this.renderer.domElement);

		this.canvas = this.renderer.domElement;
		this.renderer.domElement.className = "glcanvas";
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.gammaInput = true;
		this.renderer.gammaOutput = true;
	}

	onResize() {
		if ((this.camera as THREE.OrthographicCamera).isOrthographicCamera) {
			this.orthocamera.left = -this.canvas.width / 2;
			this.orthocamera.right = this.canvas.width / 2;
			this.orthocamera.top = this.canvas.height / 2;
			this.orthocamera.bottom = -this.canvas.height / 2;

		}
		else{
			(this.camera as THREE.PerspectiveCamera).aspect = window.innerWidth / window.innerHeight;
		}
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.render();
	}

	makeDirectionalLight({ color = 0xFFFFFF, intensity = 1, x = 0, y = 0, z = 0 } = {}) {
		const light = new THREE.DirectionalLight(color, intensity);
		light.position.set(x, y, z);
		return light;
	}

	animate() {
		requestAnimationFrame(() => this.animate());
		this.update();
		this.render();
	}

	toXYCoords(pos) {

		// var vector = projector.projectVector(pos.clone(), camera);
		// vector.x = (vector.x + 1) / 2 * window.innerWidth;
		// vector.y = -(vector.y - 1) / 2 * window.innerHeight;
		// return vector;
	}
	getCameraState() {
		const { metadata, object } = this.camera.toJSON();
		return {
			metadata,
			object,
			position: this.camera.position.clone(),
			rotation: this.camera.rotation.clone(),
			target: this.orbitControls.target.clone(),
		}
	}
	setCameraState(state) {
		this.camera.position.set(state.position.x, state.position.y, state.position.z);
		this.camera.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z, "XYZ");
		if(this.orbitControls){
			console.log(this.orbitControls)
			this.orbitControls.target.set(state.target.x, state.target.y, state.target.z);
		}
	}
	Float32BufferAttributeToTriangles(f32ba: THREE.Float32BufferAttribute) {
		const { count, itemSize, array } = f32ba;
		let iter = 0;
		let tris = [];
		const coord = ['x', 'y', 'z'];
		for (let i = 0; i < count / 3; i++){
			tris.push([]);
			for (let j = 0; j < 3; j++){
				tris[i].push(new THREE.Vector3);
				for (let k = 0; k < itemSize; k++){
					tris[i][j][coord[k]] = array[iter];
					iter++;
				}

			}
		}
		return tris;
	}
	calculateSurfaceArea(mesh: THREE.Mesh) {
		const tris = this.Float32BufferAttributeToTriangles((mesh.geometry as THREE.BufferGeometry).getAttribute('position') as THREE.Float32BufferAttribute);
		return tris.map(x => triangleArea(x[0], x[1], x[2])).reduce((a, b) => a + b);.
	}
	update() {
		switch (this.currentProcess) {
			case "base":
				if (this.sourcesAndReceivers.children.length > 0) {

					this.pickHelper.pick(this.pickPosition, this.sourcesAndReceivers.children, this.camera);
				}
				break;
			case "lookat":
					this.pickHelper.pick(this.pickPosition, this.room.solid.children, this.camera);
				break;
			case "select_surface":
				this.pickHelper.pick(this.pickPosition, this.room.solid.children, this.camera);
				break;
			default:
				this.pickHelper.pick(this.pickPosition, this.sourcesAndReceivers.children, this.camera);
				break;
		}
		if (this.easingCamera) {
			if (this.easeCameraSteps > 0) {
				this.camera.position.add(this.easeCameraDelta);
				// this.easeCameraTargetDelta.add(this.easeCameraDeltaRotation)
				// this.easeCameraCurrentFocus.add(this.easeCameraTargetDelta);
				// this.camera.lookAt(this.easeCameraCurrentFocus);
				// this.camera.lookAt(this.camera.position)
				this.camera.lookAt(this.easeCameraFocus);
				this.easeCameraSteps -= 1;
			}
			else {
				this.camera.lookAt(this.easeCameraFocus);
				this.easingCamera = false;
				this.easeCameraCallback();
			}
		}

		this.updateCallbacks.forEach(x => {
			//@ts-ignore
			x();
		})

		// this.receivers.children.forEach(x => {
		// 	x.updateWorldMatrix(true, false);
		// 	const tempvec = new THREE.Vector3();
		// 	x.getWorldPosition(tempvec);
		// 	tempvec.project(this.camera);

		// })



		// // get the normalized screen coordinate of that position
		// // x and y will be in the -1 to +1 range with x = -1 being
		// // on the left and y = -1 being on the bottom
		// tempV.project(camera);

		// // convert the normalized position to CSS coordinates
		// const x = (tempV.x * .5 + .5) * canvas.clientWidth;
		// const y = (tempV.y * -.5 + .5) * canvas.clientHeight;

		// // move the elem to that position
		// elem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

	}

	render() {
		// this.resizeRendererToDisplaySize();
		this.renderer.render(this.scene,this.camera);
	}
	setOrthographicCamera(OrthographicCamera: boolean) {

		if (this.isCameraOrtho == OrthographicCamera) {
			return
		};
		this.isCameraOrtho = OrthographicCamera;
		const q = new THREE.Quaternion();
		const p = new THREE.Vector3();
		this.camera.getWorldPosition(p);
		this.camera.getWorldQuaternion(q);


		if (this.isCameraOrtho) {
			let d = this.getDistanceFromTarget();
			let w = 2 * d * Math.tan(this.fov * Math.PI / 180);
			let h = w / (this.camera as THREE.PerspectiveCamera).aspect;
			let top = h / 2;
			let bottom = -h / 2;
			let left = -w / 2;
			let right = w / 2;
			this.camera = new THREE.OrthographicCamera(left, right, top, bottom, 1, 1000)
		}
		else {
			this.camera = new THREE.PerspectiveCamera(this.fov, this.aspect, this.near, this.far);
		}

		this.camera.setRotationFromQuaternion(q);
		this.camera.position.set(p.x, p.y, p.z);

		this.setupOrbitControls();

	}
	getDistanceFromTarget() {
		return this.camera.position.distanceTo(this.orbitControls.target);
	}
	resizeRendererToDisplaySize() {
		const needResize =
			this.renderer.domElement.width !== this.renderer.domElement.clientWidth ||
			this.renderer.domElement.height !== this.renderer.domElement.clientHeight;
		if (needResize) {
			this.renderer.setSize(
				this.renderer.domElement.clientWidth,
				this.renderer.domElement.clientHeight,
				false);
		}
		return needResize;
	}
	requestRenderIfNotRequested() {
		if (!this.renderRequested) {
			this.renderRequested = true;
			requestAnimationFrame(this.render);
		}
	}

	addGeometry(url, name = "") {
		let filetype = url.split('.').slice(-1);

		const loader = this.loaders[filetype] ? this.loaders[filetype].loader : false;
		const handler = this.loaders[filetype] ? this.loaders[filetype].handler : false;
		if (!loader) return
		return new Promise((resolve, reject) => {
			new loader().load(url, function (res) {
				handler(res, resolve, reject)
			})
		});
	}
	mouseDownHandler(event) {

		switch (event.button) {
			case 0: //left

			//get the thing that was clicked on
			const pick = this.pickHelper.getPick();

			// if it exists
				if (pick) {
					switch (this.currentProcess) {
						case "base":
							// if transform controls exists and is NOT attatched to an object
							if (this.transformControls && !this.transformControls.object) {

								//attach the transform controls to the picked object
								this.transformControls.attach(pick);
								// and i guess enable the controls why not
								this.transformControls.enabled = true;

								//store the position of the picked object in case user escapes
								pick.userData && (pick.userData.previousPosition = pick.position);


							}
							break;
						case "lookat":
							this.lookAtSurface(pick);
							break;
						case "select_surface":
							this.getSurface(pick);
							break;
						default:
							break;
					}

			}
			else {

			}
			break;
			case 1: //middle
				break;
			case 2: //right
				break;
			default:
				break;
		}


	}
	getSurface(surface) {
		console.log(surface);
	}
	lookAt(surface) {

	}
	OBJHandler(res, resolve, reject) {
		let geomarr

		if (res instanceof THREE.Group) {
			//@ts-ignore
			geomarr = res.children.map(x => x.geometry);
		}
		else if (res instanceof THREE.BufferGeometry) {
			geomarr = [res]
		}

		const debugMaterials = {
			geom: (normal) => new THREE.MeshBasicMaterial({
				color: new THREE.Color((normal[0] + 1) / 2, (normal[1] + 1) / 2, (normal[2] + 1) / 2),
				transparent: true,
				opacity: this.regularOpacity,
				side: THREE.DoubleSide,
				depthWrite: false
				// blending: THREE.SubtractiveBlending
			}),
			norm: () => new THREE.MeshNormalMaterial({
				transparent: true,
				opacity: this.regularOpacity,
				side: THREE.DoubleSide,
				// depthTest: false,
				// depthWrite: false
			}),
			wireframe: () => new THREE.MeshBasicMaterial({
				color: 0xa0a0a0,
				side: THREE.FrontSide,
				wireframeLinewidth: 5,
				wireframe: true,
			})
		}

		geomarr.forEach((geometry, i) => {

			let normal = geometry.attributes.normal.array.slice(0, 3);

			const { surface, lines } = edges(geometry.attributes.position.array);

			this.room.surfaces.push(surface);

			let edgegroup = new THREE.Group();
			if (lines) {
				lines.forEach(l => {
					var material = new THREE.LineBasicMaterial({
						color: 0x000000
					});

					var geometry = new THREE.Geometry();
					geometry.vertices.push(
						new THREE.Vector3(l.a.x, l.a.y, l.a.z),
						new THREE.Vector3(l.b.x, l.b.y, l.b.z)
					);

					var line = new THREE.Line(geometry, material);
					edgegroup.add(line)
				})
			};

			this.room.edge.add(edgegroup);
			let meshsolid = new THREE.Mesh(
				geometry,
				// debugMaterials.geom([Math.random(), Math.random(), Math.random()])
				debugMaterials.norm()
			);
			meshsolid.name = `${i}`;
			meshsolid.userData = {
				kind: "geometry",
				selectable: true,
				surface: surface,
				monteCarloHits: 0,
				alpha: 0.2,
				R(theta) {
					return reflectionCoefficient(meshsolid.userData.alpha, theta);
				}
			}

			this.room.normalsHelper.add(new THREE.VertexNormalsHelper(meshsolid, 1, 0xff0000, 1));

			this.room.solid.add(meshsolid);
			// this.scene.add(meshsolid);

			let wireframe = new THREE.Mesh(geometry, debugMaterials.wireframe());
			wireframe.visible = false;
			wireframe.userData = { kind: "wireframe", selectable: false }
			this.room.wire.add(wireframe);
			// this.scene.add(wireframe);

		})



		// var ambientLight = new THREE.AmbientLight(0x606060);
		// this.scene.add(ambientLight);

		resolve(geomarr)
	}
	STLHandler(res, resolve, reject) {
		resolve(res)
	}
	GLTFHandler(res, resolve, reject) {
		resolve(res)
	}
	ColladaHandler(res, resolve, reject) {
		resolve(res)
	}

	addSource(source: Source) {
		let geom = new SphereBufferGeometry(.2, 16, 16);
		let mat = new THREE.MeshToonMaterial({
			color: 0x00ff00,
			transparent: true,
			side: THREE.DoubleSide,
			opacity: this.regularOpacity,
			depthTest: false,
			depthWrite: false,
		});
		let mesh = new THREE.Mesh(geom, mat);
		mesh.name = source.name;
		mesh.userData = {
			kind: "pointofinterest",
			isSource: true,
			selectable: true
		}
		if (source.directivityFunction) {
			mesh.userData.directivityFunction = source.directivityFunction;
		}
		mesh.position.set(source.posarr[0], source.posarr[1], source.posarr[2])
		this.sourcesAndReceivers.add(mesh);
	}
	addReceiver(receiver: Receiver) {
		let geom = new SphereBufferGeometry(.2, 16, 16);
		let mat = new THREE.MeshToonMaterial({
			color: 0xff0000,
			transparent: true,
			side: THREE.DoubleSide,
			opacity: this.regularOpacity,
			depthTest: false,
			depthWrite: false,
		});
		let mesh = new THREE.Mesh(geom, mat);
		mesh.name = receiver.name;
		mesh.userData = {
			kind: "pointofinterest",
			isSource: false,
			selectable: true
		}
		mesh.position.set(receiver.posarr[0], receiver.posarr[1], receiver.posarr[2])
		this.sourcesAndReceivers.add(mesh);
	}
	addSourcesAndReceivers(sources, receivers) {
		sources.forEach(x => this.addSource(x));
		receivers.forEach(x => this.addReceiver(x));
	}


	updateBeams(beams: number[][][]) {
		let iter = 0;
		for (var i = 0; i < beams.length; i++) {
			for (let j = 0; j < beams[i].length; j++) {
				//@ts-ignore
				this.beams.children[0].geometry.attributes.position.array[iter] = beams[i][j][0]; iter++;
				//@ts-ignore
				this.beams.children[0].geometry.attributes.position.array[iter] = beams[i][j][1]; iter++;
				//@ts-ignore
				this.beams.children[0].geometry.attributes.position.array[iter] = beams[i][j][2]; iter++;
			}
		}
		//@ts-ignore
		this.beams.children[0].geometry.setDrawRange(0, iter+1);
		//@ts-ignore
		this.beams.children[0].geometry.attributes.position.needsUpdate = true;
	}
	setupBeams(maxSize = 6000) {
		let geometry = new THREE.BufferGeometry();
		let numPoints = maxSize;
		let positions = new Float32Array(numPoints * 3); // 3 vertices per point
		let colors = new Float32Array(numPoints * 3); // 3 channels per point
		geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
		geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));
		for (var i = 0, index = 0, l = numPoints; i < l; i++ , index += 3) {
			positions[index + 0] = 0;
			positions[index + 1] = 0;
			positions[index + 2] = 0;
			colors[index + 0] = Math.random();
			colors[index + 1] = Math.random();
			colors[index + 2] = Math.random();
		}
		var material = new THREE.LineBasicMaterial({
			vertexColors: THREE.VertexColors,

			depthTest: false,
			depthWrite: false
		});

		geometry.setDrawRange(0, 0);
		var lines = new THREE.Line(geometry, material);
		this.misclines = this.misclines || new THREE.Group();
		this.beams = new THREE.Group();
		this.beams.add(lines);
		this.scene.add(this.beams);
		this.scene.add(this.misclines);
	}

	setupRays(maxSize = 6000) {
		let geometry = new THREE.BufferGeometry();
		let numPoints = maxSize;
		let positions = new Float32Array(numPoints * 3); // 3 vertices per point
		let colors = new Float32Array(numPoints * 3); // 3 channels per point
		geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
		geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));
		for (var i = 0, index = 0, l = numPoints; i < l; i++ , index += 3) {
			positions[index + 0] = 0;
			positions[index + 1] = 0;
			positions[index + 2] = 0;
			colors[index + 0] = Math.random();
			colors[index + 1] = Math.random();
			colors[index + 2] = Math.random();
		}
		var material = new THREE.LineBasicMaterial({
			vertexColors: THREE.VertexColors,

			depthTest: false,
			depthWrite: false
		});

		geometry.setDrawRange(0, 0);
		var lines = new THREE.Line(geometry, material);
		this.rays = new THREE.Group();
		this.rays.add(lines);
		this.scene.add(this.rays);

	}


	addLine(p1: THREE.Vector3, p2: THREE.Vector3, color: THREE.Color) {
		let geometry = new THREE.BufferGeometry();
		let numPoints = 2;
		let positions = new Float32Array(numPoints * 3); // 3 vertices per point
		let colors = new Float32Array(numPoints * 3); // 3 channels per point
		geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
		geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));

		positions[0] = p1.x;
		positions[1] = p1.y;
		positions[2] = p1.z;
		colors[0] = color.r;
		colors[1] = color.g;
		colors[2] = color.b;
		positions[3] = p2.x;
		positions[4] = p2.y;
		positions[5] = p2.z;
		colors[3] = color.r;
		colors[4] = color.g;
		colors[5] = color.b;

		var material = new THREE.LineBasicMaterial({
			vertexColors: THREE.VertexColors,
			// depthTest: false,
			// depthWrite: false
		});
		geometry.setDrawRange(0, 6);
		var lines = new THREE.Line(geometry, material);
		this.misclines.add(lines);
	}
	traceRay(Ro: THREE.Vector3, Rd: THREE.Vector3, order = 5, addline = true, energy = 1, iter=1) {
		Rd.normalize();
		const raycaster = new THREE.Raycaster(Ro,Rd,);
		const intersectedObjects = raycaster.intersectObjects(this.room.solid.children);

		// if there was a hit
		if (intersectedObjects && intersectedObjects.length > 0) {
			let index = 0;
			while (index < intersectedObjects.length && intersectedObjects[index].distance == 0) {
				index++;
			}
			if (intersectedObjects[index]) {
				if (!intersectedObjects[index].object.userData.monteCarloHits) {
					intersectedObjects[index].object.userData.monteCarloHits = 0;
				}
				if (!intersectedObjects[index].object.userData.hits) {
					intersectedObjects[index].object.userData.hits = [];
				}
				if (!intersectedObjects[index].object.userData.totalEnergy) {
					intersectedObjects[index].object.userData.totalEnergy = 0;
				}
				intersectedObjects[index].object.userData.monteCarloHits += 1;
				const angle = Rd.clone().multiplyScalar(-1).angleTo(intersectedObjects[index].face.normal);
				//@ts-ignore
				if (window.DEBUG) {
					console.log(angle);
				}
				let reflectedEnergy = energy * intersectedObjects[index].object.userData.R(angle);
				let deltaEnergy = energy - reflectedEnergy;
				intersectedObjects[index].object.userData.hits.push({
					uv: intersectedObjects[index].uv,
					pos: intersectedObjects[index].point,
					incidentEnergy: energy,
					reflectedEnergy: reflectedEnergy
				});

				intersectedObjects[index].object.userData.totalEnergy += deltaEnergy;
				energy = reflectedEnergy;

				addline && (this.addLine(Ro, intersectedObjects[index].point, new THREE.Color(iter / order, iter / order, iter / order)));
				const N = intersectedObjects[index].face.normal.normalize();

				Rd = Rd.normalize();
				let Rr = new THREE.Vector3()
					.subVectors(
						Rd.clone(),
						N.multiplyScalar(
							2 * Rd.clone()
								.dot(intersectedObjects[index].face.normal)));
				if (iter < order) {
					this.traceRay(intersectedObjects[index].point, Rr, order, addline, energy, iter + 1);
				}
			}
		}
		return energy
	}
	setTrackPad(onoff: boolean) {
		this.trackPad = onoff;
		this.orbitControls.setTrackPad(this.trackPad);
	}
	setupMonteCarlo() {
		this.monteCarloIntervalIds = {};
	}
	startMonteCarlo(source_id: number, order = 10, interval = 50, showlines=true) {
		const src = this.sourcesAndReceivers.getObjectById(source_id);
		if (src && !this.monteCarloIntervalIds[source_id]) {
			src.userData.monteCarloInterval = setInterval((() => this.traceRay(src.position, new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), order, showlines, 1)).bind(this), interval);
			this.monteCarloIntervalIds[String(source_id)] = true;
		}
	}
	stopMonteCarlo(source_id: number) {
		const src = this.sourcesAndReceivers.getObjectById(source_id);
		if (src && this.monteCarloIntervalIds[source_id]) {
			window.clearInterval(src.userData.monteCarloInterval);
			this.monteCarloIntervalIds[String(source_id)] = false;
		}
	}
	stopAllMonteCarlo() {
		Object.keys(this.monteCarloIntervalIds).forEach(x=>{
			const src = this.sourcesAndReceivers.getObjectById(Number(x));
			if (src && src.userData.monteCarloInterval) {
				window.clearInterval(src.userData.monteCarloInterval);
				this.monteCarloIntervalIds[x] = false;
			}
		})
	}
	startAllMonteCarlo(order = 10, interval = 50, showlines = true) {
		const srcs = this.sourcesAndReceivers.children;
		if (srcs && srcs.length > 0) {
			srcs.forEach((x,i,a) => {
				a[i].userData.monteCarloInterval = setInterval((() => this.traceRay(x.position, new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5), order, showlines, 1)).bind(this), interval);
				this.monteCarloIntervalIds[String(x.id)] = true;
			})

		}
	}
	setupPoints(maxSize = 6000) {
		this.showReflections = true;
		let geometry = new THREE.BufferGeometry();
		let positions = new Float32Array(maxSize * 3); // 3 vertices per point
		let colors = new Float32Array(maxSize * 3); // 3 channels per point

		geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
		geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3).setDynamic(true));

		for (var i = 0, index = 0, l = maxSize; i < l; i++ , index += 3) {
			positions[index + 0] = 0;
			positions[index + 1] = 0;
			positions[index + 2] = 0;
			colors[index + 0] = 0;
			colors[index + 1] = 0;
			colors[index + 2] = 0;
		}
		var material = new THREE.PointsMaterial({
			vertexColors: THREE.VertexColors,
			depthTest: false,
			depthWrite: false,
			size: 3.5,
			sizeAttenuation: false
		});

		var pts = new THREE.Points(geometry, material);
		pts.userData = {
			kind: "receiver-reflections",
			selectable: false
		}
		this.showReflections = true;
		this.points = new THREE.Group();
		this.points.add(pts);
		this.scene.add(this.points);
	}
	updatePoints(p: number[][]) {
		for (var i = 0; i < p.length; i++) {
			//@ts-ignore
			this.points.children[0].geometry.attributes.position.array[i * 3 + 0] = p[i][0];
			//@ts-ignore
			this.points.children[0].geometry.attributes.position.array[i * 3 + 1] = p[i][1];
			//@ts-ignore
			this.points.children[0].geometry.attributes.position.array[i * 3 + 2] = p[i][2];
		}
		//@ts-ignore
		this.points.children[0].geometry.setDrawRange(0, p.length);
		//@ts-ignore
		this.points.children[0].geometry.attributes.position.needsUpdate = true;
		this.points.visible = this.showReflections;
	}

	addPoint(pt: THREE.Vector3, col: THREE.Color) {


		//@ts-ignore
		let count = this.points.children[0].geometry.drawRange.count;
		let index = count === Infinity ? 0 : count * 3;
		['x', 'y', 'z'].forEach(((component, i) => {
			//@ts-ignore
			this.points.children[0].geometry.attributes.position.array[index + i] = pt[component];
			console.log();
		}).bind(this));
		['r', 'g', 'b'].forEach(((component, i) => {
			//@ts-ignore
			this.points.children[0].geometry.attributes.color.array[index + i] = col[component];
		}).bind(this));

		//@ts-ignore
		this.points.children[0].geometry.setDrawRange(0, index/3+1);
		//@ts-ignore
		this.points.children[0].geometry.attributes.position.needsUpdate = true;
		//@ts-ignore
		this.points.children[0].geometry.attributes.color.needsUpdate = true;

	}





	lookAtSurface(surface: THREE.Mesh) {

		const s = surface.userData.surface;
		const getcenter = tri => {
			return [
				(tri.a.x + tri.b.x + tri.c.x) / 3,
				(tri.a.y + tri.b.y + tri.c.y) / 3,
				(tri.a.z + tri.b.z + tri.c.z) / 3
			]
		}
		const cs = s.tris.map(x => getcenter(x));
		const _c = cs.reduce((a, b) => {
			a[0] += b[0];
			a[1] += b[1];
			a[2] += b[2];
			return a;
		}, [0, 0, 0]).map(x => x / cs.length);
		let center = new THREE.Vector3(_c[0], _c[1], _c[2]);
		const a = new THREE.Vector3(s.tris[0].a.x, s.tris[0].a.y, s.tris[0].a.z);
		const b = new THREE.Vector3(s.tris[0].b.x, s.tris[0].b.y, s.tris[0].b.z);
		const c = new THREE.Vector3(s.tris[0].c.x, s.tris[0].c.y, s.tris[0].c.z);
		const ab = new THREE.Vector3().subVectors(b, a);
		const ac = new THREE.Vector3().subVectors(c, a);
		const cp = new THREE.Vector3().crossVectors(ab, ac).normalize().multiplyScalar(-1);

		const dist = this.camera.position.distanceTo(center);

		const newloc = center.clone().addScaledVector(cp, dist);



		this.camera.lookAt(center);

		this.easeCameraTo(newloc, cp.multiplyScalar(-1), center, 20, (() => {
			this.setOrthographicCamera(false);
			this.finishCurrentProcess();
		}).bind(this));

		// this.camera.position.set(newloc.x, newloc.y, newloc.z);



	}
	easeCameraTo(newloc: THREE.Vector3, newnorm:THREE.Vector3, focus: THREE.Vector3, steps:number, callback) {

		this.easeCameraTarget = newloc;
		this.easeCameraFocus = focus;
		this.easeCameraSteps = steps;

		// let currentdir = new THREE.Vector3();
		// this.camera.getWorldDirection(currentdir);
		// this.easeCameraCurrentFocus = this.camera.position.clone().addScaledVector(currentdir, 15);
		// this.easeCameraTargetDelta = new THREE.Vector3().subVectors(focus, this.easeCameraCurrentFocus.clone()).multiplyScalar(1 / this.easeCameraSteps);
		//this.easeCameraDeltaRotation = new THREE.Vector3().subVectors(newnorm, this.easeCameraTargetDelta).multiplyScalar(1 / this.easeCameraSteps);
		this.easeCameraDelta = new THREE.Vector3().subVectors(newloc, this.camera.position).multiplyScalar(1 / this.easeCameraSteps);
		this.easeCameraCallback = callback;
		this.easingCamera = true;
	}
	addQuatHelper(x, y, z, r) {

		document.querySelector('.dombugger-container').innerHTML +=/* html */`
			<span>x: </span><input style="width: 300px;" index="0" type="range" min="-2" max="2" step=".01" value="0" id="quat-x"><br>
			<span>y: </span><input style="width: 300px;" index="1" type="range" min="-2" max="2" step=".01" value="0" id="quat-y"><br>
			<span>z: </span><input style="width: 300px;" index="2" type="range" min="-2" max="2" step=".01" value="0" id="quat-z"><br>
			<span>w: </span><input style="width: 300px;" index="3" type="range" min="-2" max="2" step=".01" value="0" id="quat-w"><br>
		`;
		const sliders = "xyzw".split("").map(x => document.getElementById(`quat-${x}`));

		function updateQuat(index, value) {

		}
		sliders.forEach(x => {
			x.addEventListener('input', event => {
				const index = (event.target as HTMLInputElement).getAttribute('index');
				const value = Number((event.target as HTMLInputElement).value);
				const curquat = this.quatHelper.quaternion.clone();
				switch (index) {
					case "0": this.quatHelper.quaternion.set(value, curquat.y, curquat.z, curquat.w); break;
					case "1": this.quatHelper.quaternion.set(curquat.x, value, curquat.z, curquat.w); break;
					case "2": this.quatHelper.quaternion.set(curquat.x, curquat.y, value, curquat.w); break;
					case "3": this.quatHelper.quaternion.set(curquat.x, curquat.y, curquat.z, value); break;
					default: break;
				}

			})
		})

		let geom = new SphereBufferGeometry(r, 16, 16);
		let mat = new THREE.MeshNormalMaterial({
			transparent: true,
			side: THREE.BackSide,
			opacity: this.regularOpacity,
			depthTest: false,
			depthWrite: false,
		});
		let mesh = new THREE.Mesh(geom, mat);
		mesh.userData = {
			kind: "quatHelper",
			selectable: true
		}
		let q = new THREE.Vector3(x,y,z)
		mesh.position.set(q.x, q.y, q.z);
		this.quatHelper.add(mesh);

		this.quatHelper.add(
			this.makeLine(q.x, q.y, q.z, q.x + r, q.y, q.z, 0xff0000),
			this.makeLine(q.x, q.y, q.z, q.x, q.y + r, q.z, 0x00ff00),
			this.makeLine(q.x, q.y, q.z, q.x, q.y, q.z + r, 0x0000ff)
		);
	}

	get eventManager() { return this._eventManager }
	set eventManager(eventManager) { this._eventManager = eventManager; }


}
