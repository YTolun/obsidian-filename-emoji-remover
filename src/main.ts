import { Notice, Plugin, TAbstractFile, TFile } from 'obsidian';
import type { FilenameEmojiRemoverSettings } from './interfaces';
import FilenameEmojiRemoverSettingTab from './settings';
import emojiRegex from 'emoji-regex';

const DEFAULT_SETTINGS: FilenameEmojiRemoverSettings = {
	autoRemoveOnCreate: false,
	autoRemoveOnRename: false,
};

export default class FilenameEmojiRemover extends Plugin {
	settings: FilenameEmojiRemoverSettings;

	emojiRegex = emojiRegex();

	removeEmojiFromFilename = async (file: TAbstractFile) => {
		const { fileManager } = this.app;

		if (!(file instanceof TFile)) {
			return;
		}

		const [filename, oldFilename, fileExtension] = [
			file.basename,
			file.basename,
			file.extension,
		];
		let newFilename = filename;

		let filePath = file.parent.path;

		newFilename = filename.replaceAll(this.emojiRegex, '');
		if (newFilename !== oldFilename) {
			// Make sure the new file name isn't empty
			// Randomize if it is
			if (newFilename.length === 0) {
				const randomNumber = Math.floor(1000 + Math.random() * 9000);
				newFilename = `emoji-only-name-${randomNumber}`;
			}

			let newFilePath = `${filePath}/${newFilename}.${fileExtension}`;
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
		this.app.vault.off('create', this.removeEmojiFromFilename);

		if (toggle) {
			this.registerEvent(
				this.app.vault.on('create', this.removeEmojiFromFilename)
			);
		}
	}

	async autoRemoveOnRenameToggle(toggle: boolean) {
		this.app.vault.off('rename', this.removeEmojiFromFilename);

		if (toggle) {
			this.registerEvent(
				this.app.vault.on('rename', this.removeEmojiFromFilename)
			);
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
