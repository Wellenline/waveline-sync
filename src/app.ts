import { QAction, QSystemTrayIcon, QMainWindow, QSettings, QIcon, QMenu, QKeySequence, QApplication } from "@nodegui/nodegui";
import path from "path";
import { Sync } from "./sync";
import { Dialog } from "./dialog";
import { Http } from "./http";

export enum Settings {
	CONNECTED = "connected",
	SERVER = "server",
	KEY = "key",
}

export class App {
	private static _instance: App;

	public static get instance(): App {
		if (!App._instance) {
			App._instance = new App();
		}
		return App._instance;
	}

	/** QWindow instance */
	public window: QMainWindow = new QMainWindow();

	/** QSystemTray instance */
	public tray: QSystemTrayIcon = new QSystemTrayIcon();

	/** App settings cache */
	public settings = new QSettings("Wellenline", "waveline-sync");

	/** App menu */
	public appMenu = new QMenu();

	/** App Sub menu */
	public appSubMenu = new QMenu();

	public _actions: { quit: QAction; sync: QAction; connect: QAction; } = {
		connect: new QAction(),
		sync: new QAction(),
		quit: new QAction(),
	};

	private _connected = false;

	public set connected(status: boolean) {
		this._connected = status;

		this._actions.connect.setText(status ? "Disconnect" : "Connect");
		this._actions.connect.setShortcut(new QKeySequence(status ? "Alt+D" : "Alt+C"));

		this._actions.sync.setEnabled(status);

		this.settings.setValue(Settings.CONNECTED, status);
	}

	public get connected() {
		return this._connected;
	}

	public run() {
		this.connected = this.settings.value(Settings.CONNECTED).toBool();

		// Set window title
		this.window.setWindowTitle("Waveline Sync");

		// Keep app open even if window (dialog) is closed
		QApplication.instance().setQuitOnLastWindowClosed(false);

		// Setup tray
		this.tray.setIcon(this.icon("logo.png"));
		this.tray.setToolTip("Waveline Sync");
		this.tray.setContextMenu(this.appMenu);
		this.tray.show();

		// Setup actions

		this._syncAction();
		this._connectAction();
		this._quitAppAction();

		(global as any).win = this.window;
		(global as any).systemTray = this.tray;
	}

	/**
	 * Get neq QIcon by file name
	 * @param name asset name
	 */
	public icon(name: string) {
		return new QIcon(this.assetAbsolutePath(name));
	}

	/**
	 * Load asset from assets dir
	 * @param name asset name
	 */
	public assetAbsolutePath(name: string) {
		return path.resolve(__dirname, `../assets/${name}`);
	}

	public async onConnect(credentials: { server: string, key?: string }) {
		console.log("onConnect() ");

		this.settings.setValue(Settings.SERVER, credentials.server);

		if (credentials.key) {
			this.settings.setValue(Settings.KEY, credentials.key);
		}
		this.settings.sync();

		const system = await Http.instance.get(`/system/info`);

		if (!system || !system._id) {
			return this.onDisconnect();
		}

		this.connected = true;
	}

	public onDisconnect() {
		console.log("onDisconnect() ");
		this.settings.setValue(Settings.SERVER, "");
		this.settings.setValue(Settings.KEY, "");
		this.settings.sync();

		this.connected = false;
	}

	// Menu Actions
	private _syncAction() {
		this._actions.sync.setText("Sync");

		this._addSubMenu("Add Directory", () => {
			const dir = Sync.instance.onSelectDir();

			if (dir) {
				this._addSubMenu(dir, (action: QAction) => {
					this.appSubMenu.removeAction(action);
					// Stop watching for dir
					Sync.instance.unwatch([dir]);
				});
			}
		});

		// Attach submenu to sync action
		this._actions.sync.setMenu(this.appSubMenu);

		this.appMenu.addAction(this._actions.sync);
		this.appMenu.addSeparator();
	}

	private _connectAction() {
		this._actions.connect.addEventListener("triggered", () => {
			if (this.connected) {
				return this.onDisconnect();
			}
			this.window.show();
			this.window.hide();

			Dialog.instance.show();
		});

		this._actions.connect.setShortcut(new QKeySequence(this.connected ? "Alt+D" : "Alt+C"));

		this.appMenu.addAction(this._actions.connect);
		this.appMenu.addSeparator();

	}

	/** Quit app action */
	private _quitAppAction() {
		this._actions.quit.setText("Quit");
		this._actions.quit.setShortcut(new QKeySequence("Alt+Q"));
		this._actions.quit.addEventListener("triggered", () => QApplication.instance().exit(0));
		this.appMenu.addAction(this._actions.quit);
	}

	private _addSubMenu(text: string, cb: any) {
		const action = new QAction();
		action.setText(text);
		action.addEventListener("triggered", () => cb(action));
		this.appSubMenu.addAction(action);
		this.appSubMenu.addSeparator();
	}

}

App.instance.run();
