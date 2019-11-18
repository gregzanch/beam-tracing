import { Vector3 } from 'three';
type vec3 = Vector3;
export interface SourceMeshParams{
    Ro: vec3;
    Rd: vec3;
    theta
}

export class SourceMesh{
    constructor(params: SourceMeshParams) {
        
    }
}