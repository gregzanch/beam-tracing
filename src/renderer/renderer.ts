import hotkeys from 'hotkeys-js';
import * as THREE from 'three';
import { EventManager } from './../events/eventManager';
import { NumberInputEvent, TextInputEvent, TargetedInputEvent } from './event';
import { reflectionCoefficient } from '../lib/acoustics/reflection-coefficient';
import { OrbitControls } from './orbit-controls';
import { triangleArea, isFiniteAndPositive } from '../lib/math/math';
import { PickHelper } from './pick-helper';
import { Source } from '../lib/source';
import { Receiver } from '../lib/receiver';
import { InfoDiv, View } from '../user-interface';
import OBJLoader from '../lib/parsers/obj';


OBJLoader(THREE);
const edges = require('./edges.js');

export interface RoomGroup{
	solid: THREE.Group;
	wire: THREE.Group;
	edge: THREE.Group;
	surfaces: Array<any>,
	normalsHelper: THREE.Group;
}


Object.assign(window, { THREE });

interface RendererParams{
	cameraPos?: THREE.Vector3;
	cameraRot?: THREE.Euler;
}

export interface IndexedObject<T>{
	[id: string]: T
}

interface RendererSettings{
	[setting: string]: string | number | boolean;
}

class Intersection{
	pos: number[];
	angle: number;
	surfaceID: number;
	constructor(pos: THREE.Vector3, angle: number, surfaceID: number) {
		this.pos = [pos.x,pos.y,pos.z];
		this.angle = angle;
		this.surfaceID = surfaceID;
 	}
}

class Ray{
	origin: number[];
	intersections: Intersection[];
	hitRecievers: number[]
	constructor(origin: THREE.Vector3) {
		this.origin = [origin.x, origin.y, origin.z];
		this.intersections = [];
		this.hitRecievers = [];
	}
}

interface Selection{
	objects: THREE.Mesh[];
	needsUpdate: boolean; 
}
interface NextSelection{
	objects: THREE.Mesh[];
	append: boolean; 
}

interface addRecieverParams {
	radius?: number;
	name?: string;
	Rd?: THREE.Vector3;
}

export class Renderer {
	loaders: {};

	orbitControls;
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

	sourcesAndReceivers: THREE.Group;
	sources: THREE.Group;
	receivers: THREE.Group;

	points: THREE.Group;
	beams: THREE.Group;

	updateCallbacks: [];
	dragChangedCallbacks: [];

	easeCameraTarget;
	easeCameraFocus;
	easeCameraSteps;
	easeCameraCallback;
	easeCameraDelta;
	easeCameraDeltaRotation;
	easeCameraTargetDelta;
	easingCamera;
	easeCameraCurrentFocus;


	misclines: THREE.Group;

	constructorParams: RendererParams;

	_eventManager: EventManager;

	addLines: boolean = false;

	monteCarloIntervalIds: IndexedObject<boolean>;

	rays: THREE.Group;
	prevRayIndex: number = 0;
	prevRayIndexPos: number = 0;
	lastRayIndexNumber: number = 0;


	renderRequested: any = undefined;
	pickPosition: { x: number, y: number } = { x: 0, y: 0 }

	trackPad: boolean;
	fov: number = 20;
	hoverOpacity: number = 0.5;
	regularOpacity: number = 0.3;
	aspect: number = window.innerWidth / window.innerHeight;
	near: number = 0.1;
	far: number = 1000;

	gridSize: number;
	gridDivisions: number;
	pickHelper: PickHelper = new PickHelper(this.regularOpacity, this.hoverOpacity, false, false);
	gridHelper: THREE.GridHelper;
	showReflections: boolean = false;
	settings: RendererSettings;

	infoDiv: InfoDiv;

	ObjectsView: View;
	GeometryView: View;

	tfrays: Ray[];

	shouldRender: boolean = true;

	currentSelection: Selection;
	nextSelection: NextSelection; 
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
		this.dragChanged = this.dragChanged.bind(this);
		this.getTotalRaysShot = this.getTotalRaysShot.bind(this);
		this.getRaysShot = this.getRaysShot.bind(this);
		this.attachUpdateCallback = this.attachUpdateCallback.bind(this);
		this.attachDragChangedCallback = this.attachDragChangedCallback.bind(this);
		this.exitAllProcesses = this.exitAllProcesses.bind(this);
		this.finishCurrentProcess = this.finishCurrentProcess.bind(this);

		this.lookAtSurface = this.lookAtSurface.bind(this);
		this.setupEaseCamera = this.setupEaseCamera.bind(this);
		this.easeCameraTo = this.easeCameraTo.bind(this);
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
		this.setFog = this.setFog.bind(this);
		this.clearRays = this.clearRays.bind(this);
		this.clearUserData = this.clearUserData.bind(this);
		this.resetTrace = this.resetTrace.bind(this);
		this.getSurfaces = this.getSurfaces.bind(this);
		this.getHitPercentages = this.getHitPercentages.bind(this);
		this.setObjectsView = this.setObjectsView.bind(this);
		this.setGeometryView = this.setGeometryView.bind(this);
		this.setupSelections = this.setupSelections.bind(this);
		this.select = this.select.bind(this);
		this.tfrays = [];
		this.setup();
		this.animate();
		Object.assign(window, { r: this });
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
		this.setupRays(1000000);
		this.setupSelections();
		this.setupMonteCarlo();
		this.setupInfoDiv();
		this.render();

		

	}
	setupSelections() {
		this.nextSelection = {
			objects: [],
			append: false,
		} as NextSelection;
		this.currentSelection = {
			objects: [],
			needsUpdate: false
		} as Selection;
	}
	setObjectsView(ObjectsView: View) {
		this.ObjectsView = ObjectsView;
	}
	setGeometryView(GeometryView: View) {
		this.GeometryView = GeometryView;
	}
	setupInfoDiv() {
		this.infoDiv = new InfoDiv('main-info-div')
			.addStyle({
				'bottom': '0em',
				'left': '4em',
				'font-size': '9pt',
				'font-family': `'Titillium Web', sans-serif`,
			})
			.parent(document.body)
			.updateText('ready');
	}
	readyToStart() {
		return (this.sourcesAndReceivers.children.length > 0);
	}
	updateStatusText(text: string) {
		this.infoDiv.updateText(text);
	}

	setupEaseCamera() {
		this.easingCamera = false;
	}


	setupCallbacks() {
		this.updateCallbacks = [];
		this.dragChangedCallbacks = [];
	}
	setupSourcesAndReceivers() {
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
		this.updateStatusText(
			`started process '${this.currentProcess}'`
		);

	}
	setupHotKeys() {
		hotkeys('f','base', ()=>this.startProcess('select_surface'))
		hotkeys('o', 'base', this.toggleOrthographicCamera);
		hotkeys('l', 'base', () => this.startProcess('lookat'));
		hotkeys('esc', 'all', () => {
			this.exitAllProcesses();
			this.startProcess('base')
		});
		hotkeys('enter', 'all', this.finishCurrentProcess);
		hotkeys.setScope('base');

	}
	exitAllProcesses() {
		this.updateStatusText(
			`finished process '${this.currentProcess}'`
		);
		this.currentProcess = "base";
	}
	clearUserData() {
		if (this.room && this.room.solid.children.length > 0) {
			this.room.solid.children.forEach(x => {
				x.userData.totalEnergy = 0;
				x.userData.monteCarloHits = 0;
				x.userData.hits = [];
			})
		}
	}
	clearRays() {
		(this.misclines.children.length > 0) && this.scene.remove(this.scene.getObjectById(this.misclines.id))
		this.misclines = new THREE.Group();
		this.scene.add(this.misclines);
	}
	resetTrace() {
		this.clearRays();
		this.clearUserData();
	}
	finishCurrentProcess() {
		this.updateStatusText(
			`finished process '${this.currentProcess}'`
		);
		this.currentProcess = "base";
	}
	touchStartHandler(event) {
	}
	touchMoveHandler(event) {
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
			'obj': {
				//@ts-ignore
				loader: THREE.OBJLoader,
				handler: this.OBJHandler
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

	setupOrbitControls() {
		this.orbitControls = new OrbitControls(this.camera, this.canvas);
		this.orbitControls.target.set(0, 0, 0);
		this.orbitControls.update();
	}
	setupLighting() {
		this.lighting = new THREE.Group();
		// // this.lighting.add();
		const hemisphere = new THREE.HemisphereLight(0xffffff, 0x020202, 100);
		// const hemisphereHelper = new THREE.HemisphereLightHelper(hemisphere, 4);
		// this.scene.add(hemisphereHelper)
		this.lighting.add(hemisphere);
		// const directionalLight1 = this.makeDirectionalLight({
		// 	x: -1,
		// 	y: 2,
		// 	z: 4
		// })
		// this.lighting.add(directionalLight1);
		// const directionalLight1Helper = new THREE.DirectionalLightHelper(directionalLight1);
		// const directionalLight2 = this.makeDirectionalLight({
		// 	x: -1,
		// 	y: -1,
		// 	z: -2
		// });
		// this.lighting.add(directionalLight2);
		// const directionalLight2Helper = new THREE.DirectionalLightHelper(directionalLight2);
		this.scene.add(this.lighting);
		// this.scene.add(directionalLight1Helper);
		// this.scene.add(directionalLight2Helper);
	}
	setupRoom() {
		if (this.scene) {
			if (this.room) {
				if (this.room.solid) {
					this.scene.remove(this.room.solid);
				}
				if (this.room.wire) {
					this.scene.remove(this.room.wire);
				}
				if (this.room.edge) {
					this.scene.remove(this.room.edge);
				}
				if (this.room.normalsHelper) {
					this.scene.remove(this.room.normalsHelper);
				}
				if (this.room.solid) {
					this.scene.remove(this.room.solid);
				}
			}
		}
		this.room = {
			solid: new THREE.Group(),
			wire: new THREE.Group(),
			edge: new THREE.Group(),
			normalsHelper: new THREE.Group(),
			surfaces: []
		}
		this.scene.add(this.room.solid, this.room.wire, this.room.edge, this.room.normalsHelper);
	}
	setBackground(color: string) {
		this.scene.background = new THREE.Color(color);
	}
	setFog(amount) {
		//@ts-ignore
		this.scene.fog.density = amount;
	}
	setFogColor(color: string) {
		this.scene.fog.color = new THREE.Color(color);
	}
	setupScene() {
		this.scene = new THREE.Scene();
		this.scene.fog = new THREE.FogExp2(0x424242, 0.0015);
		this.scene.background = new THREE.Color(0xc0c0c0);
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
		// this.camera.rotation.set(state.rotation.x, state.rotation.y, state.rotation.z, "XYZ");
		let matrix = new THREE.Matrix4();
		matrix.elements = state.object.matrix;
		this.camera.setRotationFromMatrix(matrix);
		if(this.orbitControls){
			console.log(this.orbitControls)
			// this.orbitControls.target.set(state.target.x, state.target.y, state.target.z);
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
		return tris.map(x => triangleArea(x[0], x[1], x[2])).reduce((a, b) => a + b);
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
				const pick = this.pickHelper.getPick();
				if (pick) {
					this.updateStatusText(pick.name);
				}
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
		
	}

	render() {
		// this.resizeRendererToDisplaySize();
		if (this.shouldRender) {
			this.renderer.render(this.scene,this.camera);
		}
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
		this.updateStatusText(`ortho ${this.isCameraOrtho}`)
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

	addGeometry(url:string, filetype?:string) {

		filetype = filetype || url.split('.').slice(-1)[0];

		const loader = this.loaders[filetype] ? this.loaders[filetype].loader : false;
		const handler = this.loaders[filetype] ? this.loaders[filetype].handler : false;
		if (!loader) return
		return new Promise((resolve, reject) => {
			new loader().load(url, function (res) {
				if (!res) {
					reject("loader couldn't load the file that was supposed to be loaded lol")
				}
				else {
					handler(res, resolve, reject)
				}
			})
		});
	}
	getHitPercentages() {
		if (this.room) {
			let total = this.room.solid.children.map(x => x.userData.monteCarloHits).reduce((a, b) => a + b);
			if (total > 0) {
				return this.room.solid.children.map(x => x.userData.monteCarloHits / total * 100);
			}
			return
		}
		return
	}
	clearNextSelection() {
		this.nextSelection.objects.forEach(x => (x.children[0].visible = false));
		this.nextSelection.objects = [];
		this.nextSelection.append = false;
		this.currentSelection.objects.forEach(x => x.children[0].visible = false)
		this.currentSelection.objects = [];
		this.currentSelection.needsUpdate = true;
	}
	setNextSelection(pick: THREE.Mesh|THREE.Mesh[], append: boolean = false) {
		this.nextSelection.objects = pick instanceof Array ? pick : [pick];
		this.nextSelection.append = append;
        this.currentSelection.needsUpdate = true;
	}
	select(pick: THREE.Mesh, append: boolean = false) {


	}

	mouseupHandler(e) {
		if (this.currentSelection.needsUpdate) {
			if (this.nextSelection.append) {
				for (let i = 0; i < this.nextSelection.objects.length; i++){
					this.currentSelection.objects.push(this.nextSelection.objects[i]);
					this.nextSelection.objects[i].children[0].visible = true;
				}
			}
			else {
				this.currentSelection.objects.forEach(x => {
					x.children[0].visible = false;
				})
				this.currentSelection.objects = this.nextSelection.objects;

				this.currentSelection.objects.forEach(x => {
					x.children[0].visible = true;
				})
			}
			this.currentSelection.needsUpdate = false;
		}
		console.log(this.currentSelection);
		// console.log(this.currentSelection, this.nextSelection);
		window.localStorage.setItem('cameraState', JSON.stringify(this.getCameraState()));
	}
	mouseDownHandler(event) {
		switch (event.button) {
			case THREE.MOUSE.LEFT:
					switch (this.currentProcess) {
						case "base":
							{
								this.pickHelper.pick(this.pickPosition, this.sourcesAndReceivers.children, this.camera)
								const pick = this.pickHelper.getPick();
								if (pick) {
									this.setNextSelection(pick, this.orbitControls.keysPressed.SHIFT);
								}
								else {
									this.clearNextSelection();
								}
							}
							break;
						case "lookat":
							{
								this.pickHelper.pick(this.pickPosition, this.room.solid.children, this.camera)
								const pick = this.pickHelper.getPick();
								pick && this.lookAtSurface(pick);
							}
								break;
						case "select_surface":
							{
								this.pickHelper.pick(this.pickPosition, this.room.solid.children, this.camera)
								const pick = this.pickHelper.getPick();
								pick && this.getSurface(pick);
							}
							break;
						default:
							break;

				}
			break;
			case THREE.MOUSE.MIDDLE:
				break;
			case THREE.MOUSE.RIGHT:
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
			}),

		}


		if(this.room) this.setupRoom()
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
				new THREE.MeshPhysicalMaterial(
					{
						metalness: 0.8,
						transparent: true,
						opacity: 0.55,
						color: 0x000000,
						side: THREE.DoubleSide
					})
			);
			meshsolid.name = `surface-${i}`;
			meshsolid.userData = {
				kind: "geometry",
				selectable: true,
				surface: surface,
				monteCarloHits: 0,
				surfaceArea: this.calculateSurfaceArea(meshsolid),
				alpha: 0.05,
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

			const { GeometryView } = this;

				this.GeometryView
					.folder({
						id: 'surfaces-folder',
						label: meshsolid.name,
						expanded: false
					})
					.checkbox({
						id: 'visible',
						label: 'Visible',
						desc: 'is it visible',
						checked: meshsolid.visible
					})
					.listen('change', e => {
						meshsolid.visible = (e.target as HTMLInputElement).checked;
					})
					.textbox({
						id: 'surface-' + meshsolid.id.toString() + '-name',
						label: 'Name',
						desc: 'name',
						value: meshsolid.name
					})
					.listen('input', e => {
						(e.target as HTMLInputElement)
							.parentElement
							.parentElement
							.parentElement
							.parentElement
							.querySelector('label.folder-label')
							.textContent = (e.target as HTMLInputElement).value;
					})
					.listen('change', e => {
						meshsolid.name = (e.target as HTMLInputElement).value;
					})
					.textbox({
						id: 'alpha',
						label: 'Absorption',
						desc: 'absoption coefficient',
						value: meshsolid.userData.alpha
					})
					.listen('change', e => {
						meshsolid.userData.alpha = Number((e.target as HTMLInputElement).value);
					})
					.color({
						id: `surface-${meshsolid.id}-color`,
						label: 'Color',
						desc: 'Color',
						value: `#${(meshsolid.material as THREE.MeshPhysicalMaterial).color.getHexString()}`
					})
					.listen('input', (e: TargetedInputEvent) => {
						const value = e.target.value;
						const other = e.target.getAttribute("other");
						(GeometryView.inputs[other] as HTMLInputElement).value = value;
						(meshsolid.material as THREE.MeshPhysicalMaterial).color.setHex(Number(e.target.value.replace("#","0x")))
					}, [1, 2])
					.exitFolder()

				


		})



		// var ambientLight = new THREE.AmbientLight(0x606060);
		// this.scene.add(ambientLight);

		resolve(geomarr)
	}
	getSurfaces() {
		return this.room.solid.children
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

	addSource(Ro: THREE.Vector3, Rd: THREE.Vector3, name: string = "", theta: number = Math.PI*2, phi: number = Math.PI) {
		let geom = new THREE.SphereBufferGeometry(1, 16, 16);
		let mat = new THREE.MeshToonMaterial({
			color: 0xff00000,
			transparent: false,
			side: THREE.DoubleSide,
			// opacity: this.regularOpacity,
			// depthTest: false,
			// depthWrite: false,
		});
		let mesh = new THREE.Mesh(geom, mat);
		mesh.name = name.length>0?name:"untitled source";
		mesh.userData = {
			kind: "pointofinterest",
			isSource: true,
			selectable: true,
			theta,
			phi,
			Rd,
			numRays: 0
		}
		
		mesh.position.set(Ro.x, Ro.y, Ro.z);
		

		// var geometry = new THREE.Geometry();
		// for (var i = 0; i < 100; i++) {
		// let v = new THREE.Vector3(i, 10 * Math.sin(i / 100), 0);
		// geometry.vertices.push(v);
		// }

		// var line = new MeshLine();
		// line.setGeometry(geometry, function(p) {
		// return 0.5;
		// }); // makes width 2 * lineWidth

		// var material = new MeshLineMaterial({
		// color: new THREE.Color(0),
		// // lineWidth: 1,
		// transparent: true,
		// opacity: 0.5,
		// depthTest: false,
		// blending: THREE.NormalBlending
		// });
		// var mesh = new THREE.Mesh(line.geometry, material); // this syntax could definitely be improved!
		// this.scene.add(mesh);


		if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
		const helper = new THREE.Box3Helper(mesh.geometry.boundingBox, new THREE.Color(1.0, 0.8, 0.1));
		helper.visible=false;
		mesh.add(helper);

		this.sourcesAndReceivers.add(mesh);
		console.log(mesh.name);





		this.ObjectsView
			.folder({
				id: 'sources-folder',
				label: 'Sources',
				expanded: true
			})
			.textbox({
				id: 'source-' + mesh.id.toString() + '-name',
				label: 'Name',
				desc: 'name',
				value: mesh.name
			})
			.listen('change', e => {
				mesh.name = (e.target as HTMLInputElement).value;
			})
			.vec3({
				id: 'source-' + mesh.id.toString() + '-position',
				label: 'Position',
				desc: '',
				value: mesh.position
			})
			.listen('input', e => {
				mesh.position.setX(Number((e.target as HTMLInputElement).value));
			}, 3)
			.listen('input', e => {
				mesh.position.setY(Number((e.target as HTMLInputElement).value));
			}, 2)
			.listen('input', e => {
				mesh.position.setZ(Number((e.target as HTMLInputElement).value));
			}, 1)
			.exitFolder()

		// this.ObjectsView.this.sourcesAndRecfeivers.children[this.sourcesAndReceivers.children.length-1]
	}

	addReceiver(Ro: THREE.Vector3, params: addRecieverParams = {} as addRecieverParams) {
		let geom = new THREE.SphereBufferGeometry(1, 16, 16);
		let mat = new THREE.MeshToonMaterial({
			color: 0x00000ff,
			transparent: false,
			side: THREE.DoubleSide,
			// opacity: this.regularOpacity,
			// depthTest: false,
			// depthWrite: false,
		});
		let mesh = new THREE.Mesh(geom, mat);
		mesh.name = params.name||"untitled reciever";
		mesh.userData = {
			kind: "pointofinterest",
			isSource: false,
			selectable: true,
			Rd: params.Rd || new THREE.Vector3(0,0,0),
			numRays: 0
		}
		mesh.position.set(Ro.x, Ro.y, Ro.z);
		mesh.scale.setScalar(params.radius || 1);
		if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
		const helper = new THREE.Box3Helper(mesh.geometry.boundingBox, new THREE.Color(1.0, 0.8, 0.1));
		helper.visible=false;
		mesh.add(helper);

		this.sourcesAndReceivers.add(mesh);



		this.ObjectsView
			.folder({
				id: 'recievers-folder',
				label: mesh.name,
				expanded: true
			})
			.textbox({
				id: 'reciever-' + mesh.id.toString() + '-name',
				label: 'Name',
				desc: 'name',
				value: mesh.name
			})
			.listen('change', (e: TextInputEvent)  => {
				mesh.name = e.target.value
			})
			.vec3({
				id: 'reciever-' + mesh.id.toString() + '-position',
				label: 'Position',
				desc: '',
				value: mesh.position
			})
			.listen('input', (e: NumberInputEvent) => {
				mesh.position.setX(e.target.valueAsNumber)
			}, 3)
			.listen('input', (e: NumberInputEvent)  => {
				mesh.position.setY(e.target.valueAsNumber)
			}, 2)
			.listen('input', (e: NumberInputEvent)  => {
				mesh.position.setZ(e.target.valueAsNumber)
			}, 1)
			// .input('reciever-' + mesh.id.toString() + '-radius', 'Radius', 'radius', mesh.scale.x, 'number')
			// .listen('input', e => {

			// }, 1)
			.number({
				id: 'reciever-' + mesh.id.toString() + '-radius',
				label: 'Radius',
				desc: 'radius',
				min: 0,
				max: undefined,
				step: .1,
				value: mesh.scale.x
			})
			.listen('input', (e: NumberInputEvent) => {
				const val = e.target.valueAsNumber;
				if (val && isFiniteAndPositive(val)) {
					mesh.scale.setScalar(val);
				}
				else {
					return false;
				}
			}, 1)
			.exitFolder()

		// this.ObjectsView.this.sourcesAndRecfeivers.children[this.sourcesAndReceivers.children.length-1]
	}
	// addReceiver(receiver: Receiver) {
	// 	let geom = new THREE.SphereBufferGeometry(.2, 16, 16);
	// 	let mat = new THREE.MeshToonMaterial({
	// 		color: 0xff0000,
	// 		transparent: true,
	// 		side: THREE.DoubleSide,
	// 		opacity: this.regularOpacity,
	// 		depthTest: false,
	// 		depthWrite: false,
	// 	});
	// 	let mesh = new THREE.Mesh(geom, mat);
	// 	mesh.name = receiver.name;
	// 	mesh.userData = {
	// 		kind: "pointofinterest",
	// 		isSource: false,
	// 		selectable: true
	// 	}
	// 	mesh.position.set(receiver.posarr[0], receiver.posarr[1], receiver.posarr[2])
	// 	this.sourcesAndReceivers.add(mesh);
	// }

	addSourcesAndReceivers(sources, receivers) {
		// sources.forEach(x => this.addSource(x));
		// receivers.forEach(x => this.addReceiver(x));
	}
	traceRayByTransferFunction(Ro: THREE.Vector3, Rd: THREE.Vector3, iter = 1, order = 5) {
		if (iter == 1) {
			this.tfrays.push(new Ray(Ro));
		}
		Rd.normalize();
		const raycaster = new THREE.Raycaster(Ro, Rd);

		const intersectedObjects = raycaster.intersectObjects(this.surfacesAndRecievers);

		// if there was a hit
		if (intersectedObjects && intersectedObjects.length > 0) {
			let index = 0;
			while (index < intersectedObjects.length && Math.abs(intersectedObjects[index].distance) < 0.0001) {
				index++;
			}
			if (intersectedObjects[index]) {
				const angle = Rd.clone().multiplyScalar(-1).angleTo(intersectedObjects[index].face.normal);
				this.tfrays[this.tfrays.length - 1].intersections.push(new Intersection(intersectedObjects[index].point, angle, intersectedObjects[index].object.id));
		
				// this.addLines && (this.addLine(Ro, intersectedObjects[index].point, new THREE.Color(1 - energy, 1 - energy, 1 - energy), energy));
				
				if (intersectedObjects[index].object.userData.kind === "pointofinterest") {
					this.tfrays[this.tfrays.length - 1].hitRecievers.push(intersectedObjects[index].object.id);
					if (iter < order) {
						this.traceRayByTransferFunction(intersectedObjects[index].point, Rd, iter + 1, order);
					}
				}
				else {
					const N = intersectedObjects[index].face.normal.normalize();
					Rd = Rd.normalize();
					let Rr = new THREE.Vector3()
						.subVectors(
							Rd.clone(),
							N.multiplyScalar(
								2 * Rd.clone()
									.dot(intersectedObjects[index].face.normal)));
					if (iter < order) {
						this.traceRayByTransferFunction(intersectedObjects[index].point, Rr, iter + 1, order);
					}	
				}
				if (iter == order) {
					if (this.tfrays[this.tfrays.length - 1].hitRecievers.length > 0) {
						for (let i = 0; i < this.tfrays[this.tfrays.length - 1].intersections.length; i++){
							this.addLines && (this.appendRay(i == 0 ? this.tfrays[this.tfrays.length - 1].origin : this.tfrays[this.tfrays.length - 1].intersections[i-1].pos, this.tfrays[this.tfrays.length-1].intersections[i].pos));
						}
					}
					
				}


			}
		}
	}

	traceRayByEnergy(Ro: THREE.Vector3, Rd: THREE.Vector3, energy = 1, minEnergy = 0.4) {
		Rd.normalize();
		const raycaster = new THREE.Raycaster(Ro, Rd);
		const intersectedObjects = raycaster.intersectObjects(this.room.solid.children);

		// if there was a hit
		if (intersectedObjects && intersectedObjects.length > 0) {
			let index = 0;
			while (index < intersectedObjects.length && Math.abs(intersectedObjects[index].distance) < 0.0001) {
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
				let reflectedEnergy = energy * intersectedObjects[index].object.userData.R(angle);
				let deltaEnergy = energy - reflectedEnergy;
				intersectedObjects[index].object.userData.hits.push({
					pos: intersectedObjects[index].point,
					incidentEnergy: energy,
					reflectedEnergy: reflectedEnergy,
					angle: angle
				});

				intersectedObjects[index].object.userData.totalEnergy += deltaEnergy;

				// this.addLines && (this.addLine(Ro, intersectedObjects[index].point, new THREE.Color(1 - energy, 1 - energy, 1 - energy), energy));
				this.addLines && (this.appendRay(Ro, intersectedObjects[index].point));

				energy = reflectedEnergy;
				const N = intersectedObjects[index].face.normal.normalize();

				Rd = Rd.normalize();
				let Rr = new THREE.Vector3()
					.subVectors(
						Rd.clone(),
						N.multiplyScalar(
							2 * Rd.clone()
								.dot(intersectedObjects[index].face.normal)));
				if (energy > minEnergy) {
					this.traceRayByEnergy(intersectedObjects[index].point, Rr, energy, minEnergy);
				}

			}
		}
		return energy
	}

	traceRay(Ro: THREE.Vector3, Rd: THREE.Vector3, order = 5, energy = 1, iter=1) {
		Rd.normalize();
		const raycaster = new THREE.Raycaster(Ro,Rd);
		const intersectedObjects = raycaster.intersectObjects(this.room.solid.children);

		// if there was a hit
		if (intersectedObjects && intersectedObjects.length > 0) {
			let index = 0;
			while (index < intersectedObjects.length && Math.abs(intersectedObjects[index].distance) < 0.0001) {
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
				let reflectedEnergy = energy * intersectedObjects[index].object.userData.R(angle);
				let deltaEnergy = energy - reflectedEnergy;
				intersectedObjects[index].object.userData.hits.push({
					pos: intersectedObjects[index].point,
					incidentEnergy: energy,
					reflectedEnergy: reflectedEnergy,
					angle: angle
				});

				intersectedObjects[index].object.userData.totalEnergy += deltaEnergy;

				// this.addLines && (this.addLine(Ro, intersectedObjects[index].point, new THREE.Color(1 - energy, 1 - energy, 1 - energy), energy));
				this.addLines && (this.appendRay(Ro, intersectedObjects[index].point));

				energy = reflectedEnergy;
				const N = intersectedObjects[index].face.normal.normalize();

				Rd = Rd.normalize();
				let Rr = new THREE.Vector3()
					.subVectors(
						Rd.clone(),
						N.multiplyScalar(
							2 * Rd.clone()
								.dot(intersectedObjects[index].face.normal)));
				if (iter < order) {
					this.traceRay(intersectedObjects[index].point, Rr, order, energy, iter + 1);
				}

			}
		}
		return energy
	}

	setupRays(maxSize = 6000) {
		let geometry = new THREE.BufferGeometry();
		let numPoints = maxSize;
		let positions = new Float32Array(numPoints * 3); // 3 vertices per point
		geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3).setDynamic(true));
		geometry.setIndex(Array(numPoints * 3).fill(0));
		for (var i = 0, index = 0, l = numPoints; i < l; i++ , index += 3) {
			positions[index + 0] = 0;
			positions[index + 1] = 0;
			positions[index + 2] = 0;
		}
		var material = new THREE.LineBasicMaterial({
			color: new THREE.Color(0, 0, 0),
			transparent: true,
			opacity: 0.5,
			// depthTest: false,
			// depthWrite: false
		});

		geometry.setDrawRange(0, numPoints);
		var lines = new THREE.LineSegments(geometry, material);
		this.rays = new THREE.Group();
		this.rays.add(lines);
		this.scene.add(this.rays);

	}
	getRayGeometry() {
		return ((this.rays.children[0] as THREE.LineSegments).geometry as THREE.BufferGeometry);
	}
	getRayGeometryPositionAttribute() {
		return this.getRayGeometry().attributes['position'] as THREE.BufferAttribute
	}
	appendRay(p0: THREE.Vector3 | number[], p1: THREE.Vector3 | number[]) {
		let arr = [];
		p0 instanceof THREE.Vector3 ? arr.push(p0.x, p0.y, p0.z) : arr.push(p0[0], p0[1], p0[2]);
		p1 instanceof THREE.Vector3 ? arr.push(p1.x, p1.y, p1.z) : arr.push(p1[0], p1[1], p1[2]);
		this.getRayGeometryPositionAttribute().set(arr, this.prevRayIndex);
		this.prevRayIndex += 6;
		this.getRayGeometry().index.set([
			this.lastRayIndexNumber,
			this.lastRayIndexNumber+1
		], this.prevRayIndexPos)
		this.lastRayIndexNumber += 2;
		this.prevRayIndexPos += 2;
		this.getRayGeometryPositionAttribute().needsUpdate = true;
		this.getRayGeometry().index.needsUpdate = true;

	}
	addRay(p1: THREE.Vector3, p2: THREE.Vector3, color: THREE.Color) {
		// // .___.___.___.   .___.
		// // 0   1   2   3   4   5

		// // line material
		// var material = new THREE.LineBasicMaterial({
		// 	color: 0xffffff
		// });

		// vertices = [
		// 	new THREE.Vector3(0, 0, 0),
		// 	new THREE.Vector3(10, 0, 0),
		// 	new THREE.Vector3(20, 0, 0),
		// 	new THREE.Vector3(30, 0, 0),
		// 	new THREE.Vector3(40, 0, 0),
		// 	new THREE.Vector3(50, 0, 0)
		// ];

		// var positions = new Float32Array(vertices.length * 3);

		// for (var i = 0; i < vertices.length; i++) {

		// 	positions[i * 3] = vertices[i].x;
		// 	positions[i * 3 + 1] = vertices[i].y;
		// 	positions[i * 3 + 2] = vertices[i].z;

		// }

		// indices = [0, 1, 1, 2, 2, 3, 4, 5];

		// var geometry = new THREE.BufferGeometry();
		// geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
		// geometry.setIndex(new THREE.BufferAttribute(new Uint16Array(indices), 1));

		// var line = new THREE.LineSegments(geometry, material);
		// scene.add(line);
		//@ts-ignore
		this.beams.children[0].geometry.setDrawRange(0, iter + 1);
		//@ts-ignore
		this.beams.children[0].geometry.attributes.position.needsUpdate = true;
	}

	addLine(p1: THREE.Vector3, p2: THREE.Vector3, color: THREE.Color, opacity = 1) {
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
			transparent: true,
			opacity,
			depthTest: false,
			depthWrite: false
		});
		geometry.setDrawRange(0, 6);
		var lines = new THREE.Line(geometry, material);
		this.misclines.add(lines);
	}
	setTrackPad(onoff: boolean) {
		this.trackPad = onoff;

		this.orbitControls.setTrackPad(this.trackPad);
	}
	getRaysShot() {
		return this.sourcesAndReceivers.children.map(x=>x.userData.numRays)
	}
	getTotalRaysShot() {
		let sum = 0;
		for (let i = 0; i < this.sourcesAndReceivers.children.length; i++){
			sum += this.sourcesAndReceivers.children[i].userData.numRays
		}
		return sum
	}
	setupMonteCarlo() {
		this.monteCarloIntervalIds = {};
	}
	startMonteCarlo(source_id: number, order = 25, interval = 100, showlines=true) {
		const src = this.sourcesAndReceivers.getObjectById(source_id);
		if (src && !this.monteCarloIntervalIds[source_id]) {
			src.userData.monteCarloInterval = setInterval((() => {
				const t = Math.random() * src.userData.theta;
				const p = Math.random() * src.userData.phi;
				this.traceRay(src.position,
					new THREE.Vector3(
						Math.random() - 0.5,
						Math.random() - 0.5,
						Math.random() - 0.5
					),
					order, 1);
				src.userData.numRays += 1;
			}).bind(this), interval);
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
	startAllMonteCarlo(order = 25, interval = 100, showlines = true) {
		const srcs = this.sourcesAndReceivers.children;
		if (srcs && srcs.length > 0) {
			srcs.forEach((x,i,a) => {
				a[i].userData.monteCarloInterval = setInterval((() => {
					const t = (Math.random()-0.5) * a[i].userData.theta;
					const p = (Math.random()-0.5) * a[i].userData.phi;
					this.traceRay(x.position,
						new THREE.Vector3(
							Math.random() - 0.5,
							Math.random() - 0.5,
							Math.random() - 0.5
						), order, 1);
					a[i].userData.numRays += 1;
				}).bind(this), interval);

				this.monteCarloIntervalIds[String(x.id)] = true;
			})
		}
	}

	startAllSources(minEnergy = 0.4, interval = 100, showlines = true) {
		const srcs = this.sourcesAndReceivers.children.filter(x=>x.userData.isSource);
		if (srcs && srcs.length > 0) {
			srcs.forEach((x, i, a) => {
				a[i].userData.monteCarloInterval = setInterval((() => {
					const t = (Math.random() - 0.5) * a[i].userData.theta;
					const p = (Math.random() - 0.5) * a[i].userData.phi;
					this.traceRayByEnergy(x.position,
						new THREE.Vector3(
							Math.random() - 0.5,
							Math.random() - 0.5,
							Math.random() - 0.5
						),1, minEnergy);
					a[i].userData.numRays += 1;
				}).bind(this), interval);

				this.monteCarloIntervalIds[String(x.id)] = true;
			})
		}
	}

	startAllSourcesByTransferFunction(order=25, interval = 100, showlines = true) {
		const srcs = this.sourcesAndReceivers.children.filter(x => x.userData.isSource);
		if (srcs && srcs.length > 0) {
			srcs.forEach((x, i, a) => {
				a[i].userData.monteCarloInterval = setInterval((() => {
					this.traceRayByTransferFunction(x.position,
						new THREE.Vector3(
							Math.random() - 0.5,
							Math.random() - 0.5,
							Math.random() - 0.5
						),1,order);
					a[i].userData.numRays += 1;
				}).bind(this), interval);

				this.monteCarloIntervalIds[String(x.id)] = true;
			})
		}
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
	

	get eventManager() { return this._eventManager }
	set eventManager(eventManager) { this._eventManager = eventManager; }

	get surfacesAndRecievers() { return this.room.solid.children.concat(this.sourcesAndReceivers.children.filter(x=>!x.userData.isSource)) }


}
