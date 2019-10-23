import { Receiver } from "./receiver";
import { Source } from './source';
import {Room} from './room'
import { Beam } from './beam';
import { BSP } from './bsp';


import { Vec2, Vec3, Vec4 } from "./vector";
import { Polygon } from "./polygon";
import { Vector3 } from "three";


export class SolutionNode {
	public parent;
	public polygon;
	constructor() {
		this.parent;
		this.polygon;
	}
};

export class PathSolution{
	EPS_SIMILAR_PATHS = 1.;
	EPS_DEGENERATE_POLYGON_AREA = 1.;
	DISTANCE_SKIP_BUCKET_SIZE = 16;
	private _room: Room;
	private _source: Source;
	private _listener: Receiver;
	private _maximumOrder: number;
	private _polygonCache: any;
	private _validateCache: any;
	private _solutionNodes: any[];
	private _failPlanes: any[];

	private _pathFirstSet: any[];
	private _distanceSkipCache: any[];
	private _cachedSource: Vec3;
	private _paths: any[];


	constructor(room: Room, source: Source, listener: Receiver, maximumOrder: number) {
		this.room = room;
		this.source = source;
		this.listener = listener;
		this.maximumOrder = maximumOrder;
		this.polygonCache;
		this.validateCache;

	}


	clearCache() {

	}
	update() {
		let numProc = 0;
		let numTested = 0;
		//    cout<<this.maximumOrder<<endl;
		let source: Vec3 = new Vec3(this.source.posarr[0], this.source.posarr[1], this.source.posarr[2]);
		let target: Vec3 = new Vec3(this.listener.posarr[0], this.listener.posarr[1], this.listener.posarr[2]);

		this.paths = [];

		if (!this.solutionNodes.length || this.cachedSource != source) {
			this.clearCache();

			let root: SolutionNode = {
				polygon: 0,
				parent: -1
			}
			this.solutionNodes.push(root);

			this.solveRecursive(source, target, new Beam(), 0, 0);

			this.cachedSource = source;
			//assert(this.solutionNodes.size() == this.failPlanes.size());

			let numBuckets = (this.solutionNodes.length + this.DISTANCE_SKIP_BUCKET_SIZE - 1) / this.DISTANCE_SKIP_BUCKET_SIZE;
			this.distanceSkipCache = [];
			for (let i = 0; i < numBuckets; i++) {
				this.distanceSkipCache[i].set(0, 0, 0, 0);
			}
		}

	}


	getFailPlane(beam: Beam, target: Vec3) {
		const failPlane = new Vec4(0., 0., 0., 1.);

		return failPlane;
	}

	solveRecursive(source: Vec3, target: Vec3, beam: Beam, order: number, parentIndex: number) {

	}


	get room() { return this._room }
	set room(room) { this._room = room; }

	get source() { return this._source }
	set source(source) { this._source = source; }

	get listener() { return this._listener }
	set listener(listener) { this._listener = listener; }

	get maximumOrder() { return this._maximumOrder }
	set maximumOrder(maximumOrder) { this._maximumOrder = maximumOrder; }

	get polygonCache() { return this._polygonCache }
	set polygonCache(polygonCache) { this._polygonCache = polygonCache; }

	get validateCache() { return this._validateCache }
	set validateCache(validateCache) { this._validateCache = validateCache; }

	get solutionNodes() { return this._solutionNodes }
	set solutionNodes(solutionNodes) { this._solutionNodes = solutionNodes; }

	get failPlanes() { return this._failPlanes }
	set failPlanes(failPlanes) { this._failPlanes = failPlanes; }

	get pathFirstSet() { return this._pathFirstSet }
	set pathFirstSet(pathFirstSet) { this._pathFirstSet = pathFirstSet; }

	get distanceSkipCache() { return this._distanceSkipCache }
	set distanceSkipCache(distanceSkipCache) { this._distanceSkipCache = distanceSkipCache; }

	get cachedSource() { return this._cachedSource }
	set cachedSource(cachedSource) { this._cachedSource = cachedSource; }

	get paths() { return this._paths }
	set paths(paths) { this._paths = paths; }
}
