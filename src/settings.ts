import { App, PluginSettingTab, Setting } from 'obsidian';
import TodayQueryPlugin from './main';

export interface TodayQuerySettings {
	footerMarkdown: string;
}

export const DEFAULT_SETTINGS: TodayQuerySettings = {
	footerMarkdown: 'What a wonderful day!',
};

export class TodayQuerySettingTab extends PluginSettingTab {
	plugin: TodayQueryPlugin;

	constructor(app: App, plugin: TodayQueryPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Footer content')
			.setDesc('Markdown content to render at the bottom of today\'s daily note.')
			.addTextArea(text => {
				text
					.setPlaceholder('Enter Markdown content...')
					.setValue(this.plugin.settings.footerMarkdown)
					.onChange(async (value) => {
						this.plugin.settings.footerMarkdown = value;
						await this.plugin.saveSettings();
					});
				text.inputEl.rows = 10;
				text.inputEl.cols = 50;
			});
	}
}
