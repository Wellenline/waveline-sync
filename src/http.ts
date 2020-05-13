import fetch, { Response, Headers } from "node-fetch";
import { App, Settings } from "./app";
import FormData from "form-data";
export class Http {
	private static _instance: Http;

	public static get instance(): Http {
		if (!Http._instance) {
			Http._instance = new Http();
		}
		return Http._instance;
	}

	public get(url: string) {
		return fetch(App.instance.settings.value(Settings.SERVER).toString() + url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": App.instance.settings.value(Settings.KEY).toString(),
			},
		}).then(this.handleResponse);
	}

	public post(url: string, body) {
		return fetch(App.instance.settings.value(Settings.SERVER).toString() + url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": App.instance.settings.value(Settings.KEY).toString(),
			},
			body: JSON.stringify(body),
		}).then(this.handleResponse);
	}

	public upload(url: string, body: FormData) {
		return fetch(App.instance.settings.value(Settings.SERVER).toString() + url, {
			method: "POST",
			headers: {
				"x-api-key": App.instance.settings.value(Settings.KEY).toString(),
			},
			body,
		}).then(this.handleResponse);
	}

	private async handleResponse(response: Response) {
		const json = await response.json();
		if (!response.ok) {
			throw json.message;
		}
		return json;
	}
}
