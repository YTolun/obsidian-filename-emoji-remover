import { App, PluginSettingTab, Setting } from 'obsidian';
import type FilenameEmojiRemover from './main';

export default class FilenameEmojiRemoverSettingTab extends PluginSettingTab {
	plugin: FilenameEmojiRemover;

	constructor(app: App, plugin: FilenameEmojiRemover) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Remove manually')
			.setDesc(
				'Scan all your existing files and remove emojis from their names'
			)
			.addButton((button) =>
				button
					.setWarning()
					.setButtonText('Remove')
					.onClick(async (evt: MouseEvent) => {
						await this.plugin.removeEmojiFromAllFilenames();
					})
			);

		new Setting(containerEl)
			.setName('Auto-remove for new files')
			.setDesc(
				'When a new file is created, automatically remove emojis from its name'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoRemoveOnCreate)
					.onChange(async (value) => {
						this.plugin.settings.autoRemoveOnCreate = value;
						await this.plugin.saveSettings();
						this.plugin.autoRemoveOnCreateToggle(value);
					})
			);

		new Setting(containerEl)
			.setName('Auto-remove after rename')
			.setDesc(
				'When an existing file is renamed, automatically remove emojis from its name'
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoRemoveOnRename)
					.onChange(async (value) => {
						this.plugin.settings.autoRemoveOnRename = value;
						await this.plugin.saveSettings();
						this.plugin.autoRemoveOnRenameToggle(value);
					})
			);
	}
}
