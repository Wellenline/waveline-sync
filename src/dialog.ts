export class Dialog {
	private static _instance: Dialog;

	public static get instance(): Dialog {
		return Dialog._instance ? Dialog._instance : new Dialog();
	}

	private _visible = false;

	public show() {
		if (this._visible) {
			console.log("Dialog is already visible");
			return;
		}

		this._visible = true;
	}
}
