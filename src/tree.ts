import * as path from 'path'
import * as vscode from 'vscode'
import { log } from './extension'
import { getEnvironmentVariables } from './getEnvironmentVariables'
import { IgnoreSystem, isIgnored } from './normignore'
import { execNorminette, NormData, NormInfo } from './norminette'

enum NormTreeNodeType {
	ROOT,
	FOLDER,
	FILE,
	NORM_ERROR
}

type NormTreeNodeData = {
	type: NormTreeNodeType
} & ({
	type: NormTreeNodeType.ROOT | NormTreeNodeType.FOLDER | NormTreeNodeType.FILE
	path: string
	normData: NormData
} | {
	type: NormTreeNodeType.NORM_ERROR
	file: string
	errorData: NormInfo,
	errorId: number
})

export class NorminetteProvider implements vscode.TreeDataProvider<NormTreeNode> {
	private data: { [a: string]: Promise<NormData> } = {}
	constructor(private workspaceFolders: readonly vscode.WorkspaceFolder[], private ignores: IgnoreSystem) {
		ignores.onChange.event(() => this.updateEntireTree(true))
		this.updateEntireTree(false)
	}

	getTreeItem(element: NormTreeNode): vscode.TreeItem {
		return element
	}

	getChildren(element?: NormTreeNode): vscode.ProviderResult<NormTreeNode[]> {
		if (!this.workspaceFolders) {
			return Promise.resolve([])
		}

		if (element) {
			return Promise.resolve(this.getData(null, element)) // get a sub element
		} else {
			return Promise.all(this.workspaceFolders.map(async (folder) => (await this.getData(folder, null))[0])) // get a root element
		}
	}

	private getUnignoredNormData(path: string): Promise<NormData> {
		return new Promise<NormData>((resolve) => {
			execNorminette(path, getEnvironmentVariables().command).then((data) => {
				if (data == null)
				{
					resolve(null)
					return ;
				}
				const new_data: NormData = {}
				for (const file in data)
				{
					if (!isIgnored(vscode.Uri.parse(file), this.ignores))
					{
						new_data[file] = data[file]
					}
				}
				resolve(new_data)
			})
		})
	}

	updateEntireTree(do_refresh = true) {
		this.data = {}
		for (const folder of this.workspaceFolders) {
			this.data[folder.uri.path] = this.getUnignoredNormData(folder.uri.path)
		}
		if (do_refresh)
			this.refresh()
	}

	async updateTreeItem(editor: vscode.TextEditor) {
		if (editor.document.uri.scheme != 'file')
			return
		const file_path = editor.document.uri.path

		const new_data = await this.getUnignoredNormData(file_path)
		const new_data_string = JSON.stringify(new_data)
		let changed = false
		for (const folder in this.data) {
			const folder_data = await this.data[folder]
			if (file_path in folder_data) {
				if (new_data == null) {
					changed = true
					delete folder_data[file_path]
				} else if (changed || JSON.stringify(folder_data[file_path]) != new_data_string) {
					changed = true
					folder_data[file_path] = new_data[file_path]
				}
			} else if (new_data != null && file_path.startsWith(folder)) {
				changed = true
				folder_data[file_path] = new_data[file_path]
			}
		}
		if (changed)
			this.refresh()
	}

	private _onDidChangeTreeData: vscode.EventEmitter<NormTreeNode | undefined | null | void> = new vscode.EventEmitter<NormTreeNode | undefined | null | void>()
	readonly onDidChangeTreeData: vscode.Event<NormTreeNode | undefined | null | void> = this._onDidChangeTreeData.event

	refresh(): void {
		this._onDidChangeTreeData.fire()
	}

	private async getData(folder: vscode.WorkspaceFolder | null, element: NormTreeNode | null) {
		if (folder != null) {
			// Create root folder
			const normData = await this.data[folder.uri.path]
			if (normData == null)
				return []
			return [new NormTreeNode(folder.name, {
				type: NormTreeNodeType.ROOT,
				path: folder.uri.path,
				normData
			})]
		}
		if (element.data.type == NormTreeNodeType.NORM_ERROR)
			return []
		if (element.data.type == NormTreeNodeType.FILE) {
			// Create norm errors
			const filePath = element.data.path
			const normData = element.data.normData[filePath]
			return normData.map((datum, index) => {
				return new NormTreeNode(datum.errorText, {
					type: NormTreeNodeType.NORM_ERROR,
					errorData: datum,
					file: filePath,
					errorId: index
				})
			})
		}

		const normData = element.data.normData
		const [folders, files] = this.getContents(element.data.path, Object.keys(normData))

		// log('folders:', folders, 'data:', normData)
		return [...folders.map((folder_path) => {
			return new NormTreeNode(path.basename(folder_path), {
				type: NormTreeNodeType.FOLDER,
				path: folder_path,
				normData: this.getNormData(folder_path, normData)
			})
		}), ...files.map((file) => {
			return new NormTreeNode(path.basename(file), {
				type: NormTreeNodeType.FILE,
				path: file,
				normData: this.getNormData(file, normData)
			})
		})]
	}

	private getContents(p: string, paths: string[]): [folders: string[], files: string[]] {
		const folders = new Set<string>()
		const files = new Set<string>()
		for (const pp of paths) {
			if (path.relative(p, pp).startsWith('../'))
				continue
			const rel = path.relative(p, pp)
			const folder_name = rel.split(path.sep)[0]
			if (rel == folder_name)
				files.add(pp)
			else
				folders.add(path.resolve(p, folder_name))
		}
		return [[...folders], [...files]]
	}

	private getNormData(path: string, normData: NormData) {
		const newNormData: NormData = {}
		Object.keys(normData).forEach((v) => {
			if (v.startsWith(path))
				newNormData[v] = normData[v]
		})
		return newNormData
	}
}

// TODO: Fix line number for TOO_MANY_LINES
class NormTreeNode extends vscode.TreeItem {
	constructor(public readonly label: string, public data: NormTreeNodeData) {
		super(label, data.type == NormTreeNodeType.NORM_ERROR ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed)
		this.tooltip = `label: ${label} test`
		if (data.type == NormTreeNodeType.NORM_ERROR) {
			this.id = `${data.file} ${data.errorData.fullText} ${data.errorId}`
			this.description = `line: ${data.errorData.line + 1}`
			this.tooltip = data.errorData.fullText

			const errPos = new vscode.Position(data.errorData.line, data.errorData.col)
			this.command = {
				command: 'vscode.open',
				title: 'Open File',
				arguments: [vscode.Uri.file(data.file), {
					selection: new vscode.Range(errPos, errPos)
				}]
			}
		} else {
			this.id = `${data.path}`
			const errorCount = Object.keys(data.normData).reduce((res, val) => res + data.normData[val].length, 0)
			this.description = `${errorCount} error${errorCount == 1 ? '' : 's'}`
			if (data.type == NormTreeNodeType.FILE) {
				this.resourceUri = vscode.Uri.file(data.path)
				this.iconPath = vscode.ThemeIcon.File
			} else {
				const fileCount = Object.keys(data.normData).length
				this.description += ` in ${fileCount} file${fileCount == 1 ? '' : 's'}`
			}
		}
	}
}
