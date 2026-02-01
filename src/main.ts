import { Component, MarkdownRenderer, MarkdownView, Plugin, moment } from 'obsidian';
import { DEFAULT_SETTINGS, TodayQuerySettings, TodayQuerySettingTab } from './settings';

const FOOTER_CLS = 'today-query-footer';

interface LeafWithId {
	id: string;
}

interface AppWithInternalPlugins {
	internalPlugins?: {
		getPluginById?(id: string): {
			instance?: {
				options?: {
					format?: string;
					folder?: string;
				};
			};
		} | undefined;
	};
}

export default class TodayQueryPlugin extends Plugin {
	settings: TodayQuerySettings;
	private footerComponents: Map<string, JournalFooter> = new Map();

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new TodayQuerySettingTab(this.app, this));

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => this.updateAllLeaves())
		);
		this.registerEvent(
			this.app.workspace.on('layout-change', () => this.updateAllLeaves())
		);
		this.registerEvent(
			this.app.workspace.on('file-open', () => this.updateAllLeaves())
		);

		this.app.workspace.onLayoutReady(() => this.updateAllLeaves());

	}

	onunload() {
		this.removeAllFooters();
	}

	private updateAllLeaves() {
		const activeKeys = new Set<string>();

		// Standard markdown leaves
		for (const leaf of this.app.workspace.getLeavesOfType('markdown')) {
			const view = leaf.view;
			if (!(view instanceof MarkdownView)) continue;
			if (view.file && this.isTodaysDailyNote(view.file.path)) {
				const key = `md-${(leaf as unknown as LeafWithId).id}`;
				activeKeys.add(key);
				this.ensureFooter(view, key);
			}
		}

		// Daily Notes Editor plugin
		this.updateDailyNoteEditorLeaves(activeKeys);

		// Remove footers that are no longer active
		for (const [key, footer] of this.footerComponents) {
			if (!activeKeys.has(key)) {
				this.removeChild(footer);
				this.footerComponents.delete(key);
			}
		}
	}

	private updateDailyNoteEditorLeaves(activeKeys: Set<string>) {
		const todayStr = this.getTodayString();
		for (const leaf of this.app.workspace.getLeavesOfType('daily-note-editor-view')) {
			const containers = leaf.view.containerEl.querySelectorAll('.daily-note-container');
			containers.forEach((container, i) => {
				const text = container.textContent?.trim() ?? '';
				if (!text.startsWith(todayStr)) return;

				const sizer = container.querySelector('.cm-sizer');
				if (!sizer) return;

				const key = `dne-${(leaf as unknown as LeafWithId).id}-${i}`;
				activeKeys.add(key);

				if (this.footerComponents.has(key)) {
					if (sizer.querySelector(`.${FOOTER_CLS}`)) return;
					// Footer was removed from DOM, re-create
					this.removeChild(this.footerComponents.get(key)!);
					this.footerComponents.delete(key);
				}

				const { folder, format } = this.getDailyNotesConfig();
				const todayName = moment().format(format);
				const sourcePath = folder ? `${folder}/${todayName}.md` : `${todayName}.md`;

				const footer = new JournalFooter(sizer as HTMLElement, this, sourcePath);
				this.footerComponents.set(key, footer);
				this.addChild(footer);
			});
		}
	}

	private getTodayString(): string {
		const { format } = this.getDailyNotesConfig();
		return moment().format(format);
	}

	private ensureFooter(view: MarkdownView, key: string) {
		const mode = view.getMode();
		const contentEl = view.contentEl;
		let container: Element | null;
		if (mode === 'preview') {
			container = contentEl.querySelector('.markdown-preview-sizer');
		} else {
			container = contentEl.querySelector('.cm-sizer');
		}
		if (!container) container = contentEl;

		const existing = this.footerComponents.get(key);

		// Re-inject if mode changed (footer is in the other container)
		if (existing && !container.querySelector(`.${FOOTER_CLS}`)) {
			this.removeChild(existing);
			this.footerComponents.delete(key);
		}

		if (container.querySelector(`.${FOOTER_CLS}`)) return;

		const footer = new JournalFooter(container as HTMLElement, this, view.file!.path);
		this.footerComponents.set(key, footer);
		this.addChild(footer);
	}

	private removeAllFooters() {
		for (const [, footer] of this.footerComponents) {
			this.removeChild(footer);
		}
		this.footerComponents.clear();
	}

	private isTodaysDailyNote(filePath: string): boolean {
		const { format, folder } = this.getDailyNotesConfig();
		const todayName = moment().format(format);
		const expectedPath = folder ? `${folder}/${todayName}.md` : `${todayName}.md`;
		return filePath === expectedPath;
	}

	async loadSettings() {
		const data = ((await this.loadData()) ?? {}) as Partial<TodayQuerySettings>;
		this.settings = { ...DEFAULT_SETTINGS, ...data };
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.removeAllFooters();
		this.updateAllLeaves();
	}

	private getDailyNotesConfig(): { format: string; folder: string } {
		const appInternal = this.app as unknown as AppWithInternalPlugins;
		const dailyNotesPlugin = appInternal.internalPlugins?.getPluginById?.('daily-notes');
		const options = dailyNotesPlugin?.instance?.options ?? {};
		return {
			format: options.format || 'YYYY-MM-DD',
			folder: options.folder?.replace(/\/+$/, '') || '',
		};
	}
}

class JournalFooter extends Component {
	private el: HTMLElement;

	constructor(
		private container: HTMLElement,
		private plugin: TodayQueryPlugin,
		private sourcePath: string,
	) {
		super();
	}

	onload() {
		this.el = document.createElement('div');
		this.el.className = FOOTER_CLS;
		const backlinks = this.container.querySelector('.embedded-backlinks');
		if (backlinks) {
			this.container.insertBefore(this.el, backlinks);
		} else {
			this.container.appendChild(this.el);
		}
		void MarkdownRenderer.render(
			this.plugin.app,
			this.plugin.settings.footerMarkdown,
			this.el,
			this.sourcePath,
			this,
		);
	}

	onunload() {
		this.el?.remove();
	}
}
