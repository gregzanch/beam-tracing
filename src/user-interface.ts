import { FontAwesomeIcon, Icon } from './icon-types';
import { EltTag } from './elt-tags';
import { StyleObject } from './css-selectors';
import { clamp } from './lib/math/clamp';
export interface EltParams{
	tag: EltTag;
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


export class InfoDiv extends DOM{
	text: string;
	elt: HTMLElement;
	id: string;
	style: StyleObject;
	constructor(id: string, text=""){
		super();
		this.id = id;
		this.text = text;
		this.elt = this.create({
			tag: 'div',
			className: 'info-div',
			id: id,
			text: this.text
		});
		this.style = {} as StyleObject;
	}
	updateText(text: string) {
		this.elt.textContent = text;
		return this;
	}
	parent(elt: HTMLElement | string) {
		if (elt instanceof HTMLElement) {
			elt.appendChild(this.elt);
		}
		else {
			document.querySelector(elt).appendChild(this.elt);
		}
		return this;
	}
	addStyle(style_obj: StyleObject) {
		Object.assign(this.style, style_obj);
		let style_string = "";
		Object.keys(this.style).forEach(x => {
			style_string += `${x}: ${this.style[x]};`;
		});
		this.elt.setAttribute('style', style_string);
		return this;
	}
	attr(name:string, val:string|number|boolean) {
		this.elt.setAttribute(name, val.toString());
		return this;
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
	button(id, icon: FontAwesomeIcon | Icon, text, eventHandlers?: EventHandler[]) {
		this.buttons[id] = this.create({
			tag: 'span',
			className: 'button',
			id,
			children: [
				{ tag: 'i', className: [icon.split('-')[0] == "fa" ? 'fa' : 'fa icon', icon, 'fa-2x'] },
				{ tag: 'span', className: 'nav-text', text }
			]
		});
		return this.create({
			tag: 'li',
			children: [this.buttons[id]]
		})
	}
}

namespace InputParams {
	export interface NumberParams {
		id: string;
		label: string;
		desc: string;
		min: number;
		max: number;
		step: number;
		value: number;
		// scaleFunction?: (x: number) => number
	}
	export interface CheckboxParams {
		id: string;
		label: string;
		desc: string;
		checked: boolean;
	}
	export interface SliderParams {
		id: string;
		label: string;
		desc: string;
		min: number;
		max: number;
		step: number;
		value: number;
	}
	export interface ColorParams {
		id: string;
		label: string;
		desc: string;
		value: string;
	}
	export interface TextboxParams {
		id: string;
		label: string;
		desc: string;
		value: string;
	}
	export interface Vec3Params{
		id: string;
		label: string;
		desc: string;
		value: THREE.Vector3;
	}
	export interface FolderParams{
		id: string;
		label: string;
		expanded: boolean;
	}
}


export interface ViewParams{
	name: string;
	id: string;
	icon?: Icon
}
export class View extends DOM{
	root: HTMLElement;
	id: string;
	inputs: IndexedElementList;
	chaining: boolean;
	target: HTMLElement;
	constructor(name: string, id: string, icon?: Icon|FontAwesomeIcon) {
		super();
		this.inputs = {} as IndexedElementList;
		this.id = id;
		this.chaining = false;
		icon = icon || 'fa-circle';
		this.root = this.create({
			tag: 'div',
			children: [
				{
					tag: 'div',
					className: "side-menu-title",
					children: [
						{
							tag: 'i',
							className: ['fa', icon, 'fa-2x']
						},
						{
							tag: 'label',
							text: name
						}
					]
				},
				{
					tag: 'hr'
				},
				{
					tag: 'div',
					className: 'side-menu-content-content',
					style: 'transform:translateY(0px);'
				}
			]
		});
		this.target = this.root.querySelector('.side-menu-content-content');
		this.target.addEventListener('mousewheel', (function (e) {
			if (this.target.clientHeight > window.innerHeight * .8) {

				const translation = Number(this.target.getAttribute('style').replace(/transform\:translateY\(|px\)\;/gmi, '')) - e.deltaY;
				const val = clamp(translation, -this.target.clientHeight + window.innerHeight * .8, 0.0);
				// console.log(val / (-this.target.clientHeight + window.innerHeight * .8));
				this.target.setAttribute('style', `transform:translateY(${val}px);`);
			}
		}).bind(this))
	}
	chain() {
		this.chaining = true;
	}
	unchain() {
		this.chaining = false;
	}
	get(n:number|number[] = 1) {
		const keys = Object.keys(this.inputs);
		n = n instanceof Array ? n : [n];
		return n.map(x=>this.inputs[keys[keys.length - x]]);
	}
	listen(event: string, handler: (e: Event) => void, n:number|number[]=1) {
		this.get(n).forEach((x,i,a) => {
			a[i].addEventListener(event, handler);
		})
		return this;
	}
	section(name) {
		const section = this.create({
			tag: 'div',
			className: 'side-menu-content-subsection',
			children: [
				{
					tag: 'div',
					className: 'side-menu-content-subsection-header',
					text: name || ""
				}
			]
		});
		return this
	}
	slider(params: InputParams.SliderParams) {
		const slider = this.create({
			tag: 'input',
			type: 'range',
			id: params.id + '-slider',
			baseid: params.id,
			kind: 'slider',
			other: params.id + '-input',
			min: params.min,
			max: params.max,
			step: params.step,
			value: params.value
		});
		const input = this.create({
			baseid: params.id,
			kind: 'input',
			other: params.id+'-slider',
			id: params.id + '-input',
			tag: 'input',
			type: 'text',
		});
		(input as HTMLInputElement).value = String(params.value);
		this.inputs[params.id + '-slider'] = slider;
		this.inputs[params.id + '-input'] = input;
		const label = this.create({
			tag: 'label',
			text: params.label
		});
		this.target.appendChild(this.create({
			tag: 'div',
			className: 'labeled-input',
			children: [
				{
					tag: 'div',
					className: 'labeled-input-grid',
					children: [label, this.create({ tag: 'span', className: 'input', children: [input,slider] })]
				}
			]
		}));

		
		return this;
	}
	color(params: InputParams.ColorParams) {
		const colorinput = this.create({
          	tag: "input",
			type: 'color',
		  	other: params.id+'-text'
        });
        (colorinput as HTMLInputElement).value = params.value;
		this.inputs[params.id+'-color'] = colorinput;
		const input = this.create({
			tag: "input",
			type: 'text',
			other: params.id+'-color'
		});
		(input as HTMLInputElement).value = params.value;
		this.inputs[params.id+'-text'] = input;
        const label = this.create({
          tag: "label",
          text: params.label
        });
        this.target.appendChild(
          this.create({
            tag: "div",
            className: "labeled-input",
            children: [
              {
                tag: "div",
                className: "labeled-input-grid labeled-input-grid3",
                children: [label, colorinput, input]
              }
            ]
          })
        );
        return this;
	}
	checkbox(params: InputParams.CheckboxParams) {
		const checkbox = this.create({ tag: 'input', type: 'checkbox' });
		(checkbox as HTMLInputElement).checked = params.checked;
		this.inputs[params.id] = checkbox;
		const label = this.create({
			tag: 'label',
			text: params.label,
			id: params.id
		})
		this.target.appendChild(this.create({
			tag: 'div',
			className: 'labeled-checkbox',
			children: [
				{
					tag: 'div',
					className: 'labeled-input-grid',
					children: [label, checkbox]
				}
			]
		}));
		return this
	}
	number(params: InputParams.NumberParams) {
		const input = this.create({
			tag: "input",
			type: "number",
			id: params.id
		});
		params.value && ((input as HTMLInputElement).value = String(params.value));
		params.min && ((input as HTMLInputElement).min = String(params.min));
		params.max && ((input as HTMLInputElement).max = String(params.max));
		params.step && ((input as HTMLInputElement).step = String(params.step));

		this.inputs[params.id] = input;
		const label = this.create({
			tag: 'label',
			text: params.label||"#######"
		})
		this.target.appendChild(this.create({
			tag: 'div',
			className: 'labeled-input',
			children: [
				{
					tag: 'div',
					className: 'labeled-input-grid',
					children: [label, input]
				}
			]
		}));
		// if (params.scaleFunction) {
		// 	input.addEventListener('mousewheel', e => {
		// 		(e.target as HTMLInputElement).value = String(params.scaleFunction((e.target as HTMLInputElement).valueAsNumber))
		// 	})
		// }
		return this;
	}
	textbox(params: InputParams.TextboxParams) {
		const input = this.create({
			tag: 'input',
			type: 'text',
			id: params.id
		});
		(input as HTMLInputElement).value = params.value;
		this.inputs[params.id] = input;
		const label = this.create({
			tag: 'label',
			text: params.label
		})
		this.target.appendChild(this.create({
			tag: 'div',
			className: 'labeled-input',
			children: [
				{
					tag: 'div',
					className: 'labeled-input-grid',
					children: [label, input]
				}
			]
		}));
		return this;
	}
	vec3(params: InputParams.Vec3Params) {
		const inputx = this.create({
			tag: 'input',
			type: 'number'
		});
		const inputy = this.create({
			tag: 'input',
			type: 'number'
		});
		const inputz = this.create({
			tag: 'input',
			type: 'number'
		});
		(inputx as HTMLInputElement).value = String(params.value.x);
		(inputy as HTMLInputElement).value = String(params.value.y);
		(inputz as HTMLInputElement).value = String(params.value.z);
		this.inputs[`${params.id}.x`] = inputx;
		this.inputs[`${params.id}.y`] = inputy;
		this.inputs[`${params.id}.z`] = inputz;
		this.target.appendChild(this.create({
			tag: 'div',
			className: 'labeled-input-row-container',
			children: [
				{
					tag: 'label',
					className: 'labeled-input-row-label',
					text: params.label
				},
				{
					tag: 'div',
					className: ['labeled-input-row,section-indent-1'],
					children: [
						{
							tag: 'div',
							className: ['labeled-input,labeled-input-vec3'],
							children: [this.create({
								tag: 'label',
								text: 'x:'
							}), inputx]
						},
						{
							tag: 'div',
							className: ['labeled-input,labeled-input-vec3'],
							children: [this.create({
								tag: 'label',
								text: 'y:'
							}), inputy]
						},
						{
							tag: 'div',
							className: ['labeled-input,labeled-input-vec3'],
							children: [this.create({
								tag: 'label',
								text: 'z:'
							}), inputz]
						}
					]
				}
			]
		}));
		return this;
	}
	folder(params: InputParams.FolderParams) {
		const folderContents = this.create({
			tag: 'div',
			id: params.id,
			className: 'folder-contents'
		});
		const folderOpenCloseButton = this.create({
			tag: 'a',
			className: ['folder-open-close-button'],
			text: params.expanded ? '▼' : '▶'
		});
		const folderLabel = this.create({
			tag: 'label',
			className: ['folder-label'],
			text: params.label
		});
		const folder = this.create({
			tag: 'div',
			className: 'folder-container',
			expanded: params.expanded,
			children: [
				folderOpenCloseButton,
				folderLabel,
				folderContents
			]
		});
		folderOpenCloseButton.addEventListener('click', e => {
			const expanded = folder.getAttribute('expanded')==="true";
			if (expanded) {
				folderOpenCloseButton.textContent = "▶";
				folder.setAttribute('expanded','false')
			}
			else {
				folderOpenCloseButton.textContent = "▼";
				folder.setAttribute('expanded', 'true')
			}
		})
		folderLabel.addEventListener('click', e => {
			const expanded = folder.getAttribute('expanded') === "true";
			if (expanded) {
				folderOpenCloseButton.textContent = "▶";
				folder.setAttribute('expanded', 'false')
			}
			else {
				folderOpenCloseButton.textContent = "▼";
				folder.setAttribute('expanded', 'true')
			}
		})
		this.target.appendChild(folder);
		this.target = folderContents;

		return this;
	}
	exitFolder() {
		this.target = this.target.parentElement.parentElement;
	}
	testtime(html:string) {
		this.target.innerHTML = html;
	}
	hide() {
		if (arguments.length == 0) {
			!this.root.classList.contains('hidden') && this.root.classList.add('hidden')
		}
	}
	show() {
		if (arguments.length == 0) {
			this.root.classList.contains('hidden') && this.root.classList.remove('hidden')
		}
	}
	emit(event: string) {
		this.get().forEach(x=>x.dispatchEvent(new Event(event)));
		return this;
	}

}


export interface SideMenuState{
	root_attr: {
		state: string
		style: string
	},
	props: {
		currentView: string
	}
}

export interface IndexedViewList{
	[key: string]: View
}
export class SideMenu extends DOM{
	buttons: IndexedElementList;
	views: IndexedViewList;
	root: HTMLElement;
	state: string;
	currentView: string;
	numColumns: string;
	constructor() {
		super();
		this.currentView = "";
		this.state = 'collapsed';
		this.buttons = {} as IndexedElementList;
		this.views = {} as IndexedViewList;
		this.root = this.create({
			tag: 'nav',
			id: 'side-menu',
			moving: 'false',
			className: 'side-menu',
			style: 'width:400px',
			state: 'collapsed',
			numColumns: '2',
			children: [
				{
					tag: 'div',
					className: 'side-menu-drag-handle',
				},
				{
					tag: 'div',
					className: 'side-menu-content'

				}
			]
		});


		document.body.appendChild(this.root);
	}
	getDefaultState() {
		const viewKeys = Object.keys(this.views);
		return {
			root_attr: {
				state: "collapsed",
				style: "width:400px"
			},
			props: {
				currentView: viewKeys.length > 0 ? viewKeys[0] : ""
			}
		} as SideMenuState;
	}
	saveState(storage_key: string = "sideMenu") {
		const state = {
			root_attr: {
				state: this.root.getAttribute('state'),
				style: this.root.getAttribute('style'),
			},
			props: {
				currentView: this.currentView
			}
		} as SideMenuState;
		window.localStorage.setItem(storage_key, JSON.stringify(state));
	}
	restoreState(state?: SideMenuState | string) {
		//TODO clean this up lol
		const storedState = window.localStorage.getItem('sideMenu');
		if (!storedState) {
			console.log(storedState)
			state = this.getDefaultState();
		}
		else {
			state = storedState
		}
		state = state
			? (typeof state === "string")
				? JSON.parse(state) as SideMenuState
				: state
			: (this.getDefaultState());
		this.setView(state.props.currentView);
		this.root.setAttribute('state', state.root_attr.state);
		this.root.setAttribute('style', state.root_attr.style);
		this.state = state.root_attr.state;
	}
	collapse() {
		this.state = 'collapsed';
		this.root.setAttribute('state', 'collapsed');
	}
	expand() {
		this.state = 'expanded';
		this.root.setAttribute('state', 'expanded');
	}
	seperator() {
		return this.create({ tag: 'hr', className: "menu-seperator" });
	}
	addView(view: View) {
		this.views[view.id] = view;
		this.root.querySelector(`.side-menu-content`).appendChild(this.views[view.id].root);
		this.views[view.id].hide();
		return this;
	}
	setView(view: string | View) {
		if (typeof view === "string") {
			view = this.views[view];
		}
		if (this.currentView === view.id) {
			if (this.state === "expanded") {
				this.collapse();
			}
			else {
				this.expand();
			}
		}
		else if (this.state === "collapsed") {
			this.expand();
		}
		this.hideAllViews();
		this.currentView = view.id;
		view.show();
	}
	hideAllViews() {
		Object.keys(this.views).forEach(key => {
			this.views[key].hide()
		})
	}
	hide(elt: HTMLElement) {
		if (!elt.classList.contains('hidden')) {
			elt.classList.add('hidden');
		}
	}
	show(elt: HTMLElement) {
		if (elt.classList.contains('hidden')) {
			elt.classList.remove('hidden');
		}
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


export class ModalWindow extends DOM{
	inputs: IndexedElementList;
	window: HTMLElement;
	constructor(name) {
		super();
		this.inputs = {} as IndexedElementList;
		this.window = this.create({
			tag: 'div',
			className: ["modal-window", "hidden"],
			deltax: '0',
			deltay: '0',
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
		this.checkbox = this.checkbox.bind(this);
		this.slider = this.slider.bind(this);
		this.window.querySelector('.window-close-button').addEventListener('click', this.toggleVisibility)


	}
	toggleVisibility() {
		this.window.classList.toggle('hidden');
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
	slider(name = "", id = "", className = "", min = 0, max = 100, step = 1) {
		const input = this.create({
			tag: 'input',
			type: 'range',
			name,
			id,
			className,
			min,
			max,
			step
		});
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
