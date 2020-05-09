import { App } from "./app";
import { FSWatcher, watch } from "chokidar";
import { QFileDialog, FileMode } from "@nodegui/nodegui";

export class Sync {
    private ext: string[] = [".mp3", ".flac", ".m4a"];
    private _fsWatcher!: FSWatcher;

    private _paths: string[] = [];

    private static _instance: Sync;

	public static get instance(): Sync {
		return Sync._instance ? Sync._instance: new Sync();
    }
    
    public onSelectDir() {
        const fileDialog = new QFileDialog();
		fileDialog.setFileMode(FileMode.Directory);
        fileDialog.exec();

        if (fileDialog.result()) {
            const selectedFiles = fileDialog.selectedFiles();

            this.watch(selectedFiles);

            return selectedFiles[0];
        }
    }

    /** Watch paths */
    public watch(paths: string[]) {
        console.log("Start watching", paths);

        if (!this._fsWatcher) {

        }
    }

    /** Unwatch paths */
    public unwatch(paths: string[]) {
        console.log("Stop watching", paths);

    }
}