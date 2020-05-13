import { App, Settings } from "./app";
import { FSWatcher, watch } from "chokidar";
import { QFileDialog, FileMode } from "@nodegui/nodegui";
import path from "path";
import { Http } from "./http";
import FormData from "form-data";

import { createReadStream } from "fs";

export class Sync {

	public static get instance(): Sync {
		if (!Sync._instance) {
			Sync._instance = new Sync();
		}
		return Sync._instance;
	}

	private static _instance: Sync;
	public _dirs: string[] = [];

	private ext: string[] = [".mp3", ".flac", ".m4a"];
	private _isSyncing = false;

	private _fsWatcher: FSWatcher;
	private _timer: NodeJS.Timeout;

	private _files: string[] = [];
	private _queue: string[] = [];

	public onSelectDir() {
		const fileDialog = new QFileDialog();
		fileDialog.setFileMode(FileMode.Directory);
		fileDialog.exec();

		if (fileDialog.result()) {
			const selectedFiles = fileDialog.selectedFiles();
			const unique = selectedFiles.filter((p) => {
				return !this._dirs.includes(p);
			});

			this._dirs = this._dirs.concat(unique);
			App.instance.settings.setValue(Settings.SYNC_DIRS, JSON.stringify(this._dirs));

			this._fsWatcher.add(unique);

			return selectedFiles[0];
		}
	}

	public onRemoveDir(dirs: string[]) {
		this._dirs = this._dirs.filter((p: string) => {
			return !dirs.includes(p);
		});

		App.instance.settings.setValue(Settings.SYNC_DIRS, JSON.stringify(this._dirs));

		this._fsWatcher.unwatch(dirs);
	}

	/** Watch paths */
	public watch() {
		try {
			this._dirs = JSON.parse(App.instance.settings.value(Settings.SYNC_DIRS).toString());
		} catch (err) {
			// console.error(err);
		}

		if (!this._fsWatcher) {
			this._fsWatcher = watch(this._dirs, {
				persistent: true,
			}).on("add", this._onFileAdded.bind(this)).on("unlink", this._onFileRemoved.bind(this));
		}

		return this._dirs;
	}

	/** Unwatch paths */
	public unwatch() {
		if (this._fsWatcher) {
			this._fsWatcher.removeAllListeners();
		}
	}

	private _onFileAdded(p: string) {
		clearTimeout(this._timer);
		if (this.ext.includes(path.extname(p))) {

			this._files.push(p);
		}

		this._timer = setTimeout(() => {
			if (this._files.length > 0) {
				this._sync(this._files);
				this._files = [];
			}

		}, 3000);
	}

	private _onFileRemoved(file: any) {
		console.log(`file removed`, file);

	}

	private async _sync(files: string[]) {
		try {
			const response = await Http.instance.post(`/sync`, {
				separator: path.sep,
				root: this._dirs,
				files,
			});

			if (response.length === 0) {
				return;
			}

			if (this._isSyncing) {
				console.log("Sync already in progress, push new ", response.length, "items to the queue");
				this._queue.push(...response);
				return;
			}

			this._isSyncing = true;

			this._queue = response;

			let index = 0;

			const sleep = (time: number) => {
				return new Promise((resolve) => setTimeout(resolve, time));
			};

			for (const file of this._queue) {

				index++;

				const formData = new FormData();

				const parts: string[] = file.split(path.sep);
				const name = parts[parts.length - 1];

				let filePath = file;

				const rootPaths = this._dirs;
				for (const root of rootPaths) {
					filePath = filePath.replace(root, "");
				}

				const cleanedPath = filePath.replace(/\\/g, "/");
				const filePathDir = cleanedPath.split("/");

				filePathDir.pop();
				filePathDir.shift();

				const dir = filePathDir.join("/");

				formData.append("data", createReadStream(file));
				formData.append("name", name);
				formData.append("file", filePath);
				formData.append("dir", dir);
				formData.append("separator", path.sep);
				formData.append("root", JSON.stringify(this._dirs));

				await Http.instance.upload(`/sync/upload`, formData).catch((err) => console.log("Failed to upload", err));

				console.log(`Syncing file ${index}/${this._queue.length}`);
				App.instance._actions.sync.setText(`⟳ Syncing file ${index}/${this._queue.length}`);

				await sleep(1000);

			}

			this._isSyncing = false;
			this._queue = [];
			// hideAction.setEnabled(false);
			App.instance._actions.sync.setText(`✓ Ready to sync`);

		} catch (err) {
			console.log(err);
		}
	}
}
