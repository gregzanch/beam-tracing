import { PointOfInterest, PointOfInterestParams } from './point-of-interest';





export interface SourceParams extends PointOfInterestParams{
	directivityFunction?: (theta: number, phi: number) => number
	Rd?: THREE.Vector3;
	

}

export function defaultDirectivityFunction(theta: number, phi: number): number{
	return 1;
}

export class Source extends PointOfInterest{
	public directivityFunction: (theta: number, phi: number) => number;
	constructor(params: SourceParams) {
		super(params);
		this.directivityFunction = params.directivityFunction || defaultDirectivityFunction;

	}
}
