
export interface EltParams{
	tag: string;
	id?: string;
	className?: string|string[];
	children?: HTMLElement[]|EltParams[];
	text?: string;
	[attr: string]: string|string[]|number|EltParams|EltParams[]|boolean|HTMLElement[];
}

export interface IndexedElementList {
	[id: string]: HTMLElement
}

export interface EventHandler{
	event: string;
	handler: (e) => void;
}

export class DOM{
	constructor() {}
	create(params: EltParams | HTMLElement) {
		if (params instanceof HTMLElement) { return params }
		else {
			const elt = document.createElement(params.tag);
			Object.keys(params).forEach(x => {
				switch (x) {
					case "className": elt.setAttribute("class", params[x].toString().replace(/,+/gm, ' ')); break;
					case "children": params[x].forEach(y => elt.appendChild(this.create(y))); break;
					case "text": elt.textContent = params[x]; break;
					case "tag": break;
					default: elt.setAttribute(x, params[x].toString()); break;
				}
			});
			return elt;
		}
	}
}

export class MainMenu extends DOM{
	buttons: IndexedElementList;
	constructor() {
		super();
		this.buttons = {} as IndexedElementList;
	}
	seperator() {
		return this.create({ tag: 'hr', className: "menu-seperator" });
	}
	button(id, icon, text, eventHandlers?: EventHandler[]) {
		this.buttons[id] = this.create({
			tag: 'span',
			className: 'button',
			id,
			children: [
				{ tag: 'i', className: ['fa', icon, 'fa-2x'] },
				{ tag: 'span', className: 'nav-text', text }
			]
		});
		return this.create({
			tag: 'li',
			children: [this.buttons[id]]
		})
	}
}


const a = /* hmtl */(`
	<div class="modal-window hidden">
		<div class="window-title">Settings</div>
		<hr>
		<div class="window-main">
			<div>
				<label for="modal-window-position">Window Position</label>
				<select name="modal-window-position" id="modal-window-position">
					<option value="center">Center</option>
					<option value="left">Left</option>
					<option value="right">Right</option>
					<option value="top">Top</option>
					<option value="bottom">Bottom</option>
				</select>
			</div>
			<div>
				<label for="interface-opacity">Interface Opacity</label>
				<input type="text" name="interface-opacity" id="interface-opacity">
			</div>
		</div>
	</div>
`)

function render(html) {

}

`
<svg height="100" width="100">
  <circle cx="50" cy="50" r="40" stroke="black" stroke-width="3" fill="red" />
</svg>
`

export class ModalWindow extends DOM{
	inputs: IndexedElementList;
	window: HTMLElement;
	constructor(name) {
		super();
		this.inputs = {} as IndexedElementList;
		this.window = this.create({
			tag: 'div',
			className: ["modal-window", "hiddenish"],
			children: [
				{
					tag: 'i',
					className: 'fa fa-minus-circle window-close-button'
				},
				{
					tag: 'div',
					className: ["window-title"],
					text: name,
				},
				{
					tag: 'hr'
				},
				{
					tag: 'div',
					className: 'window-main',
					children: [
						{
							tag: 'div',
							children: []
						}
					]
				}
			]
		});

		document.body.appendChild(this.window);
		this.toggleVisibility = this.toggleVisibility.bind(this);
		this.window.querySelector('.window-close-button').addEventListener('click', this.toggleVisibility)
	}
	toggleVisibility() {
		this.window.classList.toggle('hiddenish');
	}
	checkbox(name="", id="", className="", checked=false) {
		const input = this.create({
			tag: 'input',
			type: 'checkbox',
			name,
			id,
			className
		});
		if (typeof checked !== "undefined") {
			if (checked) {
				input.setAttribute('checked', 'true');
			}
		}
		const label = this.create({
			tag: 'label',
			for: id,
			text: name
		});
		const div = this.create({
			tag: 'div',
			children: [
				input,
				label,
			]
		});
		this.window.querySelector('.window-main').appendChild(div);
		return input;
	}


}
