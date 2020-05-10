import { QAction, QSystemTrayIcon, QMainWindow, QSettings, QIcon, QMenu, QKeySequence, QApplication } from "@nodegui/nodegui";
import path from "path";
import { Sync } from "./sync";

export enum Settings {
	CONNECTED = "connected",
	SERVER = "server",
	KEY = "key",
}

export class App {

	public static get instance(): App {
		return App._instance ? App._instance : new App();
	}

	public set connected(status: boolean) {
		this._connected = status;
		this.settings.setValue(Settings.CONNECTED, status);
	}

	public get connected() {
		return this._connected;
	}

	private static _instance: App;

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

	public _actions: { quit?: QAction; sync?: QAction; connect?: QAction; } = {};

	private _connected = false;

	public run() {
		console.log("App running");

		// Set window title
		this.window.setWindowTitle("Waveline Sync");

		// Keep app open even if window (dialog) is closed
		QApplication.instance().setQuitOnLastWindowClosed(false);

		// Setup tray
		this.tray.setIcon(this._icon("logo.png"));
		this.tray.setToolTip("Waveliny Sync");
		this.tray.setContextMenu(this.appMenu);
		this.tray.show();

		// Setup actions

		this._syncAction();
		this._quitAppAction();

		(global as any).win = this.window;
		(global as any).systemTray = this.tray;
	}

	/**
	 * Get neq QIcon by file name
	 * @param name asset name
	 */
	public _icon(name: string) {
		return new QIcon(this._assetAbsolutePath(name));
	}

	/**
	 * Load asset from assets dir
	 * @param name asset name
	 */
	public _assetAbsolutePath(name: string) {
		return path.resolve(__dirname, `../assets/${name}`);
	}

	// Menu Actions

	private _syncAction() {
		this._actions.sync = new QAction();

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

	/** Quit app action */
	private _quitAppAction() {
		this._actions.quit = new QAction();
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
