import { PointOfInterest, PointOfInterestParams } from './point-of-interest';

export interface ReceiverParams extends PointOfInterestParams {

}

export class Receiver extends PointOfInterest {
	constructor(params: ReceiverParams) {
		super(params);
	}
}
