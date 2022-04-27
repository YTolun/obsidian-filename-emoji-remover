import { Notice, Plugin, TAbstractFile } from 'obsidian';
import type { FilenameEmojiRemoverSettings } from './interfaces';
import FilenameEmojiRemoverSettingTab from './settings';
import emojiRegex from 'emoji-regex';

const DEFAULT_SETTINGS: FilenameEmojiRemoverSettings = {
	autoRemoveOnCreate: false,
	autoRemoveOnRename: false,
};

export default class FilenameEmojiRemover extends Plugin {
	settings: FilenameEmojiRemoverSettings;

	removeEmojiFromFilename = async (file: TAbstractFile) => {
		const { fileManager } = this.app;

		const [filename, fileExtension] = file.name.split('.');
		const oldFilename = filename;
		let newFilename = filename;

		let filePath = file.path.split('/');
		filePath.pop();

		const regex = emojiRegex();
		const matches = Array.from(filename.matchAll(regex));

		if (matches.length > 0) {
			for (const match of filename.matchAll(regex)) {
				const emoji = match[0];
				newFilename = newFilename.replace(emoji, '');
			}

			// Make sure the new file name isn't empty
			if (newFilename.length === 0) {
				const randomNumber = Math.floor(1000 + Math.random() * 9000);
				newFilename = `emoji-only-name-${randomNumber}`;
			}
			filePath.push(`${newFilename}.${fileExtension}`);
			let newFilePath = filePath.join('/');

			await fileManager.renameFile(file, newFilePath);
			new Notice(`${oldFilename} is renamed to ${newFilename}`);
		}
	};

	removeEmojiFromAllFilenames = async () => {
		const { vault } = this.app;

		await Promise.all(
			// Get all the files in the vault
			vault.getFiles().map(async (file) => {
				await this.removeEmojiFromFilename(file);
			})
		);
	};

	async autoRemoveOnCreateToggle(toggle: boolean) {
		if (toggle) {
			this.registerEvent(
				this.app.vault.on('create', this.removeEmojiFromFilename)
			);
		} else {
			this.app.vault.off('create', this.removeEmojiFromFilename);
		}
	}

	async autoRemoveOnRenameToggle(toggle: boolean) {
		if (toggle) {
			this.registerEvent(
				this.app.vault.on('rename', this.removeEmojiFromFilename)
			);
		} else {
			this.app.vault.off('rename', this.removeEmojiFromFilename);
		}
	}

	async onload() {
		await this.loadSettings();

		if (this.settings.autoRemoveOnCreate) {
			this.autoRemoveOnCreateToggle(true);
		}

		if (this.settings.autoRemoveOnRename) {
			this.autoRemoveOnRenameToggle(true);
		}

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'remove-emoji-from-all-filenames',
			name: 'Remove emojis from all filenames',
			callback: () => {
				this.removeEmojiFromAllFilenames();
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FilenameEmojiRemoverSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
