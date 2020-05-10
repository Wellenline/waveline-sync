import { QDialog } from "@nodegui/nodegui";

export class Dialog {
	private static _instance: Dialog;

	public static get instance(): Dialog {
		if (!Dialog._instance) {
			Dialog._instance = new Dialog();
		}
		return Dialog._instance;
	}

	private _dialog: QDialog;

	private _visible = false;

	public show() {
		if (this._visible) {
			console.log("Dialog is already visible");
			return;
		}

		this._visible = true;
		this._dialog = new QDialog();
		this._dialog.show();
		this._dialog.setWindowTitle("Waveline Sync");

		(global as any).dialog = this._dialog;
	}
}
