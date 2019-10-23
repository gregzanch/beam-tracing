import { mag } from './mag';
export function projectionDistance(pt, pleq) {
return (pleq[0]*pt[0]+pleq[1]*pt[1]+pleq[2]*pt[2]+pleq[3]) / mag([pleq[0], pleq[1], pleq[2]]);
}


export function projection(pt, pleq) {

}
