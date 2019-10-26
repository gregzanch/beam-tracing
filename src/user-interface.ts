import { Icon } from './fa-list';

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


export interface ViewParams{
	name: string;
	id: string;
	icon?: Icon
}
export class View extends DOM{
	root: HTMLElement;
	id: string;
	constructor(name: string, id: string, icon?: Icon ) {
		super();
		this.id = id;
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
					className: 'side-menu-content-content'
				}
			]
		})
	}
	testtime(html:string) {
		this.root.querySelector('.side-menu-content-content').innerHTML = html;
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
