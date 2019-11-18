import * as THREE from 'three';

export class Cursor extends THREE.Mesh{
    constructor(pos?: THREE.Vector3) {
        super();
        this.position = pos || this.position;
        
    }
}

