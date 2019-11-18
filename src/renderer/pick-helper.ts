import * as THREE from 'three';

export class PickHelper {
	public raycaster: typeof THREE.Raycaster.prototype;
	public pickedObject;
	public debugElt;
	public pickedObjectID;
	public defaultOpacity;
	public activeOpacity;
	public debug;
	constructor(defaultOpacity = 0.3, activeOpacity = 0.5, debug=false, debugElt=false) {
		this.raycaster = new THREE.Raycaster();
		this.pickedObject = false;
		this.pickedObjectID = "";
		this.defaultOpacity = defaultOpacity;
		this.activeOpacity = activeOpacity;
		this.debug = debug;
		if (this.debug) {
			if (!debugElt) {
				this.debugElt = document.createElement('div');
				this.debugElt.setAttribute('style', 'position: absolute; top: 50px');
				document.body.appendChild(this.debugElt);
			}
			else {
				this.debugElt = debugElt;
			}
		}
	}
	getPick() {
		return this.pickedObject
	}
	pick(normalizedPosition, objects, camera) {

		// if (this.pickedObject) {
		// 	this.pickedObjectID = this.pickedObject.id;
		// 	this.pickedObject = undefined;
		// }
		if (!(objects instanceof Array)) {
			return
		}

		this.raycaster.setFromCamera(normalizedPosition, camera);
		const intersectedObjects = this.raycaster.intersectObjects(objects);

		// if there was a hit
		if (intersectedObjects && intersectedObjects.length > 0) {
			// if the hovered object is different than the previous hovered object

			let kinds = intersectedObjects.map(x => x.object.userData.kind);
			let index = 0;
			if (kinds.includes("pointofinterest")) {
				index = kinds.indexOf("pointofinterest");
			}
			else if (kinds.includes("geometry")) {
				index = kinds.indexOf("geometry");
			}


			if (intersectedObjects[index].object.id !== this.pickedObjectID) {
				if (this.pickedObject) {
					// restore the opacity of the previously hovered object
					this.pickedObject.material.opacity = this.defaultOpacity;
				}
				// change the previously hovered object to the current hovered object
				this.pickedObject = intersectedObjects[index].object;
				// change the id variable
				this.pickedObjectID = intersectedObjects[index].object.id
				// change the opacity of the current hovered object
				this.pickedObject.material.opacity = this.activeOpacity;
				// update the dom text
				this.debug && (this.debugElt.textContent = this.pickedObject.name.length > 0 ? this.pickedObject.name : "no name");
			}
		}
		// nothing was hit
		else {
			if (this.pickedObject) {
				// restore the opacity of the previously hovered object
				this.pickedObject.material.opacity = this.defaultOpacity;
				// nullify the pickedObject
				this.pickedObject = false;
				//nullify the id variable
				this.pickedObjectID = "";
				// update the dom text
				this.debug && (this.debugElt.textContent = "-")
			}
		}
	}
}
