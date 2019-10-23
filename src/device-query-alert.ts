
export class DeviceQueryAlert{
	parent: HTMLElement;
	elt: HTMLElement;
	progressbar: HTMLElement;
	progresstext: HTMLElement;
	isTouchPad: boolean;
	progress: number;
 	scrolling:boolean
	oldTime: number;
	newTime: number;
	eventCount: number;
	eventCountStart: number;
	totalEventCount: number;
	devicequeryalert: HTMLElement;
	constructor() {
	this.parent = document.createElement('div');
	this.progress = 0;
	this.scrolling = false;
	this.oldTime = 0;
	this.newTime = 0;
	this.eventCount = 0;
	this.eventCountStart;
	this.totalEventCount = 10;
		this.isTouchPad = false;
	document.body.appendChild(this.parent);
		this.parent.outerHTML = `
			<div id="device-query-alert">
				<style>
				.device-query-alert {
					width: 50vw;
					height: 50vh;
					position: absolute;
					transform: translate(0, 100vh);
					left: 25vw;
					top: 25vh;
					background: rgba(245, 252, 255, .95);
					-webkit-box-shadow: 0px 0px 26px -9px rgba(0, 0, 0, 0.43);
					-moz-box-shadow: 0px 0px 26px -9px rgba(0, 0, 0, 0.43);
					box-shadow: 0px 0px 26px -9px rgba(0, 0, 0, 0.43);
					border-width: 1px;
					border-color: silver;
					border-style: solid;
					border-radius: 5px;
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
				}

				.device-query-alert[showing=false] {
					transform: translate(0, 100vh);
					transition: transform 0.3s ease 0s;
				}

				.device-query-alert[showing=true] {
					transform: translate(0, 0);
					transition: transform 0.3s ease 0s;
				}

				.device-query-alert-header {
					width: 100%;
					text-align: center;
					text-anchor: middle;
					padding: 1em 0em .5em;
					font-size: 14pt;

				}

				.device-query-alert-text {
					width: 100%;
					text-align: center;
					text-anchor: middle;
					padding: .25em 0em 1em;
					font-size: 10pt;
				}

				.progress-bar {
					--bar-width: 90%;
					--left-margin: calc((100% - var(--bar-width, 80%))/2);
					--bar-height: 10px;
				}

				.progress-bar-back {

					width: var(--bar-width, 80%);
					height: var(--bar-height, 10px);
					margin-top: 0;
					margin-left: calc((100% - var(--bar-width, 80%))/2);
					background: rgba(0, 0, 0, .2);
				}

				.progress-bar-top {
					transform: translate(0, calc(-1*var(--bar-height)));
					height: var(--bar-height, 10px);
					/*margin-top: 1em;*/
					margin-left: calc((100% - var(--bar-width, 80%))/2);
					background: rgba(46, 252, 5, 0.612);
				}

				.progress-bar-text {
					width: 100%;
					text-align: center;
					text-anchor: middle;
					font-size: 10pt;
				}
			</style>
			<div class="device-query-alert">
				<div class="device-query-alert-header">Device Detection:</div>
				<div class="device-query-alert-text">Scroll around to detect device (mouse, trackpad, finger, etc)</div>

				<div class="progress-bar">
					<div class="progress-bar-text">0%</div>
					<div class="progress-bar-back"></div>
					<div class="progress-bar-top" style="width: 0%"></div>
				</div>
			</div>
		</div>`;
		this.devicequeryalert = document.querySelector('.device-query-alert')
		this.progressbar = document.querySelector('.progress-bar-top');
		this.progresstext = document.querySelector('.progress-bar-text');
		this.mouseHandle = this.mouseHandle.bind(this);
		this.show = this.show.bind(this);
		this.hide = this.hide.bind(this);
		this.onComplete = this.onComplete.bind(this);
//@ts-ignore
		window.isTouchPad = this.isTouchPad;
		document.addEventListener("mousewheel", this.mouseHandle, false);
		document.addEventListener("DOMMouseScroll", this.mouseHandle, false);

	}
	mouseHandle(evt){
		var isTouchPadDefined = this.isTouchPad || typeof this.isTouchPad !== "undefined";
		// // console.log(isTouchPadDefined, progress);
		this.progressbar.setAttribute('style', `width: ${this.progress * .9}%`);
		this.progresstext.textContent = `${this.progress.toFixed(2)}%`
		if (!isTouchPadDefined) {
			if (this.eventCount == 0) {
				this.eventCountStart = new Date().getTime();
			}

			this.eventCount++;
			this.progress = (this.eventCount / this.totalEventCount) * 100;

			if (new Date().getTime() - this.eventCountStart > 100) {
				if (this.eventCount > this.totalEventCount) {
					this.isTouchPad = true;

					//@ts-ignore
					window.isTouchPad = this.isTouchPad;
				} else {
					this.isTouchPad = false;
					//@ts-ignore
					window.isTouchPad = this.isTouchPad;
				}
				isTouchPadDefined = true;
			}
		}

		if (isTouchPadDefined) {
			this.progress = 100;
			this.devicequeryalert.setAttribute('showing', 'false');
			setTimeout((() => {
				// console.log(this.isTouchPad);
				document.removeEventListener("mousewheel", this.mouseHandle, false);
				document.removeEventListener("DOMMouseScroll", this.mouseHandle, false);
				this.parent.remove();
			}).bind(this), 500)
			if (!evt) evt = event;
			var direction = (evt.detail < 0 || evt.wheelDelta > 0) ? 1 : -1;

			if (this.isTouchPad) {
				this.newTime = new Date().getTime();

				if (!this.scrolling && this.newTime - this.oldTime > 550) {
					this.scrolling = true;
					if (direction < 0) {
						// swipe down
					} else {
						// swipe up
					}
					setTimeout((function () {
						this.oldTime = new Date().getTime();
						this.scrolling = false
					}).bind(this), 500);
				}
			} else {
				if (direction < 0) {
					// swipe down
				} else {
					// swipe up
				}
			}
		}
	}
	show() {
		this.devicequeryalert.setAttribute('showing', "true")
	}
	hide() {
		this.devicequeryalert.setAttribute('showing', "false")
	}
	onComplete() {

	}

}
