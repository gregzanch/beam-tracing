

export class DomBugger{
	parent: HTMLElement;
	elt: HTMLElement;
	watchlist;
	constructor(parent) {
		this.parent = parent;
		if (!this.parent) {
			this.parent = document.createElement('div');
			this.parent.setAttribute('style', 'position: absolute; z-index: 2');
			document.body.appendChild(this.parent);
		}
		this.elt = document.createElement('table');
		this.elt.setAttribute('class', "dombugger");
		this.parent.appendChild(this.elt);

		this.watchlist = [];
	}
	watch(name, updateInterval, getter) {
		const watchee = {
			name,
			updateInterval,
			getter,
			elt: ((parent) => {
				let row = document.createElement('tr');
				let tdleft = document.createElement('td');
				tdleft.textContent = name;
				let tdright = document.createElement('td');
				tdright.textContent = "...";
				tdright.id = name;
				row.className = "dombugger-item";
				row.appendChild(tdleft);
				row.appendChild(tdright);
				parent.appendChild(row);
				return tdright;
			})(this.elt),
			displayText: (val) => val.toFixed(4),
			updateDom: undefined
		};
		function updateDom(watchItem) {
			watchItem.elt.textContent = watchItem.displayText(watchItem.getter());
		}
		watchee.updateDom = updateDom;
		window.setInterval(() => {
			updateDom(watchee);
		}, watchee.updateInterval);
		this.watchlist.push(watchee);
	}

}
