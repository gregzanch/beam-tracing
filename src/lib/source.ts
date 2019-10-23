import { PointOfInterest, PointOfInterestParams } from './point-of-interest';





export interface SourceParams extends PointOfInterestParams{

}

export class Source extends PointOfInterest{
	constructor(params: SourceParams) {
		super(params);

	}
}
