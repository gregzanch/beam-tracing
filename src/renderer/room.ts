import * as THREE from "three";

export class Room {
    solid: THREE.Group;
    edge: THREE.Group;
    normalsHelper: THREE.Group;
    constructor() {
        this.solid = new THREE.Group();
        this.edge = new THREE.Group();
        this.normalsHelper = new THREE.Group(); 
    }
    setVertexNormalVisibility(visibility: boolean) {
        if (this.normalsHelper) {
            this.normalsHelper.visible = visibility;
        }
    }
    setSurfaceMaterial(params){
		if (this.solid) {
			this.solid.children.forEach((mesh: THREE.Mesh) => {
				(mesh.material as THREE.Material) = new THREE.MeshPhysicalMaterial(params)
			});
		}
	}
	setSurfaceColor(r, g, b, a) {
		if (this.solid) {
			this.solid.children.forEach((mesh: THREE.Mesh) => {
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
}
