import {
	QDialog, WidgetEventTypes,
	FlexLayout, QWidget, QGridLayout,
	QLabel, QLineEdit, QPushButton, WidgetAttribute,
	EchoMode, CursorShape, QPixmap, AspectRatioMode,
	AlignmentFlag, QMessageBox, ButtonRole,
} from "@nodegui/nodegui";
import { App } from "./app";

export class Dialog {
	private static _instance: Dialog;

	public static get instance(): Dialog {
		if (!Dialog._instance) {
			Dialog._instance = new Dialog();
		}
		return Dialog._instance;
	}

	private _dialog: QDialog;
	private _widget: QWidget;
	private _gridLayout: QGridLayout;
	private _loading: QWidget;
	private _loadingLabel: QLabel;

	private _serverInput: QLineEdit;
	private _serverKeyInput: QLineEdit;
	private _connectButton: QPushButton;

	private _visible = false;

	public show() {
		if (this._visible) {
			console.log("Dialog is already visible");
			return;
		}

		this._visible = true;

		// Setup dialog
		this._dialog = new QDialog();
		this._dialog.setWindowTitle("Waveline Sync");
		this._dialog.setFixedSize(500, 390);
		this._dialog.addEventListener(WidgetEventTypes.Close, () => this._onDialogClose());

		this._dialog.setLayout(new FlexLayout());
		this._dialog.setObjectName("setupView");

		// Add QWidget to dialog
		this._widget = new QWidget();
		this._widget.setObjectName("contentView");
		this._gridLayout = new QGridLayout();

		// Create server input
		this._serverInput = new QLineEdit();
		this._serverInput.setAttribute(WidgetAttribute.WA_MacShowFocusRect, false);
		this._serverInput.setPlaceholderText("Waveline Server");

		// Create server api key input
		this._serverKeyInput = new QLineEdit();
		this._serverKeyInput.setAttribute(WidgetAttribute.WA_MacShowFocusRect, false);
		this._serverKeyInput.setPlaceholderText("Waveline API Key");
		this._serverKeyInput.setEchoMode(EchoMode.Password);

		// Create connect buttion
		this._connectButton = new QPushButton();
		this._connectButton.setText("Connect");
		this._connectButton.setCursor(CursorShape.PointingHandCursor);
		this._connectButton.addEventListener("clicked", this._onConnect.bind(this));

		// Setup view grid
		this._gridLayout.addWidget(this._serverInput, 0, 0);
		this._gridLayout.addWidget(this._serverKeyInput, 1, 0);
		this._gridLayout.addWidget(this._connectButton, 2, 0);

		this._widget.setLayout(this._gridLayout);

		this._loading = new QWidget();
		this._loading.setObjectName("loading");
		const loadingLayout = new FlexLayout();
		this._loading.setLayout(loadingLayout);

		this._loadingLabel = new QLabel();
		this._loadingLabel.setText("Connecting, please wait");
		this._loadingLabel.setObjectName("label");

		loadingLayout.addWidget(this._loadingLabel);

		// Build dialog ui
		this._dialog.layout?.addWidget(this._appHeader());
		this._dialog.layout?.addWidget(this._widget);

		this._dialog.setStyleSheet(this.stylesheet);

		this._dialog.show();

		(global as any).dialog = this._dialog;
	}

	private async _onConnect() {
		try {
			console.log("Connect to server");

			this._dialog.layout?.removeWidget(this._widget);
			this._widget.close();

			this._dialog.layout?.addWidget(this._loading);
			this._loading.show();

			const credentials = {
				key: this._serverKeyInput.text(),
				server: this._serverInput.text(),
			};
			setTimeout(() => {
				this._widget.show();
				this._loading.close();
			}, 3000);
		} catch (err) {
			const messageBox = new QMessageBox();
			messageBox.setText(err.toString());
			const accept = new QPushButton();
			accept.setText("OK");
			messageBox.addButton(accept, ButtonRole.AcceptRole);
			messageBox.exec();
		} finally {
			this._widget.show();
			this._loading.close();
		}
	}

	private _onDialogClose() {
		this._visible = false;
		this._dialog.removeEventListener(WidgetEventTypes.Close, () => {
			// ok
		});
	}

	private _appHeader() {
		const header = new QWidget();
		header.setObjectName("appHeader");

		header.setLayout(new FlexLayout());

		header.layout?.addWidget(this._appLogo());
		header.layout?.addWidget(this._appName());

		header.setStyleSheet(`
			#appHeader {
				padding: 20px;
				background-color: #09090b;
			}
		`);

		return header;
	}

	private _appLogo() {
		const logo = new QLabel();
		const image = new QPixmap();
		image.load(App.instance.assetAbsolutePath("logo.png"));

		logo.setPixmap(image.scaled(50, 50, AspectRatioMode.KeepAspectRatio));
		logo.setAlignment(AlignmentFlag.AlignCenter);
		return logo;
	}

	private _appName() {
		const appName = new QLabel();
		appName.setText("Waveline Sync");
		appName.setAlignment(AlignmentFlag.AlignCenter);
		appName.setObjectName("label");
		return appName;
	}

	private get stylesheet() {
		return `
			* {
				font-size: 14px;
			}
			#loading {
				flex: 1;
				background-color: #000;
				align-items: 'center';
				justify-content: 'center';
			}
			#contentView {
				margin: 15px;
				height: 270px;
			}
			#label {
				color: #fff;
			}
			#setupView {
				background: black;
				flex-direction: 'column';
			}
			QLineEdit {
				background: #09090b;
				margin-bottom: 10px;
				color: white;
				padding: 10px;
				height: 40px;
				border: 1px solid;
				border-color: transparent;
				border-radius: 10px;
			}
			QLineEdit:focus{
				border:1px solid #4caf50;
			}
			QPushButton {
				background: transparent;
				color: #555;
				padding: 10px;
				height: 40px;
				border: 3px solid;
				border-color:#09090b;
				border-radius: 10px;
			}
		`;
	}
}
