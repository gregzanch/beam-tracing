import { vec3a, vec3, vec4, AABB, reflect, raytrix, raytrix2, norm, dot, sub, dist} from './math/math';

import { Source, SourceParams } from './source';
import { Receiver, ReceiverParams } from './receiver';
import * as STLParser from './parsers/stl';
import { BufferGeometry, PointLight } from 'three';
import { Polygon } from './polygon';
import { peqp } from './process/util/peqp';

// const sub3 = require('gl-vec3/sub');

// import * as GPU from "gpu.js/dist/gpu-browser";


export class Reflection {
	public pos;
	public polyIndex: number;
	public children: Reflection[];
	public parent: Reflection | Receiver;
	constructor(pos: number[], polyIndex: number, parent: Reflection | Receiver, children?: Reflection[]) {
		this.pos = pos;
		this.polyIndex = polyIndex;
		this.children = children || [];
		this.parent = parent;
	}
}


export interface BeamTracerParams{
	geometry?: BufferGeometry|Array<BufferGeometry>;
	sources?: Array<Source>;
	receivers?: Array<Receiver>;
}

export interface SolutionNode{
	parent: number;
	polygon: Polygon;
}



export class BeamTracer{
	private _geometry;
	private _sources;
	private _receivers;
	private _polygons;
	private solutionNodes;
	private _webgl;
	private _triangles;
	public reflections;
	private _tree;
	public imageSources;
	// public reflections;
	constructor(params: BeamTracerParams) {
		params.geometry && (this._geometry = params.geometry);
		params.sources && (this._sources = params.sources);
		params.receivers && (this._receivers = params.receivers);
		this._polygons = [];
		this._triangles = [];
		this.solutionNodes = [];
		// for each surface in geometry, calculate surface's plane equation
		if (this._geometry.length > 0) {
			for (let i = 0; i < this._geometry.length; i++){
				this._polygons.push(new Polygon(this._geometry[i]));
			}
		}
		// this._webgl = new GPU({
		// 	mode: 'gpu'
		// });
	}

	walk(imageSource, depth=0, index=0) {
		console.log(imageSource, depth, index);
		if (imageSource.children && imageSource.children.length > 0) {
			imageSource.children.forEach((x,i) => {
				this.walk(x,depth+1,i);
			})
		}
	}
	traverse(imageSource, path=[]) {
		let newPath = path.concat(imageSource);
		if (imageSource.children && imageSource.children.length > 0) {
			imageSource.children.forEach((x, i) => {
				this.traverse(x, newPath);
			})
		}
		let beampts = [];
		let currentpt = imageSource.receiever
		for (let i = newPath.length - 1; i > 0; i--){
			sub(newPath[i].imageSource,currentpt)
		}
	}

	reflect() {

	}

	getReflectionRays() {
		let rays = [];
		// for each polygon
		this._polygons.forEach((poly: Polygon) => {
			// rays.push(sub3([], this.sources[0].posarr, reflect(this.receivers[0].posarr, poly.pleq, poly.n)));
		});
		return rays;
	}

	constructTree(order = 2) {
		for (let i = 0; i < this.polygons.length; i++){

		}
	}
	reflectPolygon(p1: Polygon, p2: Polygon) {
		let reflections = [];
		p1.tris.forEach(tri => {
			tri.forEach(pt => {
				const ref = reflect(pt, p2.pleq, p2.n);
				reflections.push(...pt);
			});
		});
		return new Polygon(reflections);
	}

	inFrontOf(s1, s2) {

	}

	solve(order = 2) {
		let beams = [];
		const stack = [];
		this.computeImageSourcesRecursive(stack, beams, this.receivers[0].posarr,this.sources[0].posarr, undefined, order)
		// this.imageSources.map(x => normsub(x, this.receivers[0].posarr));
		// this.imageSources.forEach(x => {
		// 	this.walk(x);
		// })


		console.log(beams);



		return beams;
	}

	computeVirtualSources() {

	}
	computeImageSourcesRecursive(stack: any[], beams:any[], receiver: number[], source: number[], prev_surface: Polygon, max_order: number) {
		// let imageSources = [];
		// we need to reflect the source about all of the visible surfaces in the mesh
		stack.push({});
		this.polygons.map((surface: Polygon, index: number) => {

			if (!prev_surface || (surface.id !== prev_surface.id && dot(surface.n, prev_surface.n) < 0)) {

					// reflect the current source about the surface
					const imageSource = reflect(source, surface.pleq, surface.n);



					stack.pop();
					stack.push({
						source,
						imageSource,
						receiver,
						surface
					});


					beams.push(this.resolveBeams(stack));


					if (max_order > 0) {
						this.computeImageSourcesRecursive(stack, beams, receiver, imageSource, surface, max_order - 1);
					}

			}

		});

		stack.pop();


		return beams;
	}

	resolveBeams(stack) {
		/**
		 * we need:
		 * 	the previous intersection pos (if none use receiver pos)
		 *	the image source pos, (if none use source pos)
		 * 	the intersecting surface
		 */

		console.log(Array.from(stack));
		const beams = [];
		let prev_itx;
		let ro;
		let rd;
		for (let i =0; i<stack.length; i++){
			ro = (i == stack.length - 1) ? stack[i].receiver : prev_itx;
			if (ro) {
				rd = sub(stack[i].imageSource, ro);
				prev_itx = this.surfaceIntersection(ro, rd, stack[i].surface);
				beams.push(prev_itx);
			}
		}
		if (beams[beams.length - 1]) {
			// beams.push(stack)
		}
		return beams;
	}

	surfaceIntersection(ro, rd, surface) {
		let intersection;
		surface.tris.forEach(tri => {
			let itx = raytrix(ro, rd, tri);
			if (itx) {
				if (!peqp(itx, [0, 0, 0])) {
					intersection = itx;
				}
			}
		})
		return intersection;
	}

	computeImageSources(source: number[], prev_surface: Polygon, max_order: number) {

		// we need to reflect the source about all of the visible surfaces in the mesh
		const ORDER0 = !prev_surface;
		this.polygons.forEach((surface: Polygon) => {
			if (ORDER0 || (
				//inFrontOf(surface, prev_surface) &&
				dot(surface.n, prev_surface.n) < 0)) {
				const newSource = reflect(source, surface.pleq, surface.n);
				this.imageSources.push(newSource);
				if (max_order > 0)
					this.computeImageSources(newSource, surface, max_order - 1)
			}

		})
	}

	reflectReceiver() {
		let reflections = [];
		let itxs = [];
		// for each polygon
		this._polygons.forEach((poly: Polygon) => {
			// reflect receiever about the polygon
			const ref = reflect(this.receivers[0].posarr, poly.pleq, poly.n);
			reflections.push(ref);

			// let ray = sub3([], this.sources[0].posarr, ref);
			poly.tris.forEach(tri => {
				// find the intersection of each each tri
				var itx = raytrix(this.sources[0].posarr, [], tri);
				if (!peqp(itx, [0, 0, 0])) {
					if (itx[0] > 100) {
						console.log(itx)
					}
					itxs.push(itx);
				}
			})

		})
		return {
			reflections, itxs
		}
	}
	justReflect() {
		let reflections = [];
		this.polygons.forEach((poly: Polygon) => {
			const ref = reflect(this.receivers[0].posarr, poly.pleq, poly.n);
			// console.log(ref);
		})
	}
	traceRay(ro, rd, order=5) {
		let itx0;
		let currentdist = 1e10;
		for (let i = 0; i < this._polygons.length; i++){
			for (let j = 0; j < this._polygons[i].tris.length; j++){
				console.log(this._polygons[i].tris[j])
				var itx = raytrix(ro, rd, this._polygons[i].tris[j]);
				console.log(itx)
				if (!peqp(itx, [0, 0, 0])) {
					let d = dist(ro, itx);
					if (!itx0 || d < currentdist) {
						itx0 = itx;
						currentdist = d;
					}
				}
			}
		}
		return itx0
	}

	montecarlo() {
		let rays = [];
		rays
		for (let i = 0; i < 100; i++) {
			const rd = new vec3a(Math.random(), Math.random(), Math.random())

		}
	}

	gpuSolve() {

		// const gpu = new GPU({ mode: 'gpu' });


		// const kernelFunction = function (srcpos: number[], recpos: number[], arr: Float32Array){
		// 	const x =
		// 		.25 +
		// 		anInt +
		// 		anArray[this.thread.x] +
		// 		aNestedArray[this.thread.x][this.thread.y];
		// 	return x;
		// };
		// const kernel = gpu.createKernel(kernelFunction, { output: [1], warnVarUsage: false });
		// //@ts-ignore
		// const result = window.result = kernel(1, [.25], [[1.5]]);

		// // console.log(result[0]); // 3



	}

	get tree() { return this._tree }
	set tree(tree) { this._tree = tree; }


	get polygons() { return this._polygons }
	set polygons(_: Polygon[]) { this._polygons = _ };

	get geometry(){ return this._geometry}
	set geometry(_: BufferGeometry|Array<BufferGeometry>) { this._geometry = _ }



	get sources() { return this._sources }
	set sources(_: Array<Source>) { this._sources = _ }
	pushSource(source: Source) {
		this._sources.push(source);
	}
	addSource(params: SourceParams) {
		this._sources.push(new Source(params))
	}


	get receivers() { return this._receivers }
	set receivers(_: Array<Receiver>) { this._receivers = _ }
	pushReceiver(receiver: Receiver) {
		this._receivers.push(receiver);
	}
	addReceiver(params: ReceiverParams) {
		this._receivers.push(new Receiver(params))
	}
}
