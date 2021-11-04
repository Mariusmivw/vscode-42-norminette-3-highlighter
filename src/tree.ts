import * as path from 'path'
import * as vscode from 'vscode'
import { log } from './extension'
import { getEnvironmentVariables } from './getEnvironmentVariables'
import { execNorminette, NormData } from './norminette'

enum NormTreeNodeType {
	ROOT,
	FOLDER,
	FILE,
	NORM_ERROR
}

export class NorminetteProvider implements vscode.TreeDataProvider<NormTreeNode> {
	constructor(private workspaceFolders: readonly vscode.WorkspaceFolder[]) {}

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
			return Promise.all(this.workspaceFolders.map(async (folder)=>(await this.getData(folder, null))[0])) // get a root element
		}
	}

	private _onDidChangeTreeData: vscode.EventEmitter<NormTreeNode | undefined | null | void> = new vscode.EventEmitter<NormTreeNode | undefined | null | void>()
	readonly onDidChangeTreeData: vscode.Event<NormTreeNode | undefined | null | void> = this._onDidChangeTreeData.event

	refresh(): void {
		this._onDidChangeTreeData.fire()
	}

	private async getData(folder: vscode.WorkspaceFolder | null, element: NormTreeNode | null) {
		if (folder != null)
		{
			// Create root folder
			const normData = await execNorminette(folder.uri.path, getEnvironmentVariables().command)
			return [new NormTreeNode(folder.name, vscode.TreeItemCollapsibleState.Collapsed, folder.uri.path, normData, NormTreeNodeType.ROOT)]
		}
		if (element.type == NormTreeNodeType.FILE)
		{
			// Create norm errors
			const normData = element.normData[element.path]
			return normData.map((datum)=>{
				return new NormTreeNode(datum.errorText, vscode.TreeItemCollapsibleState.None, '', {}, NormTreeNodeType.NORM_ERROR, `line: ${datum.line}`)
			})
		}
		log(element.label, element.path)

		const [folders, files] = this.getContents(element.path, Object.keys(element.normData))
		return [...folders.map((folder) => {
			return new NormTreeNode(path.basename(folder), vscode.TreeItemCollapsibleState.Collapsed, folder, this.getNormData(folder, element.normData), NormTreeNodeType.FOLDER)
		}), ...files.map((file) => {
			return new NormTreeNode(path.basename(file), vscode.TreeItemCollapsibleState.Collapsed, file, this.getNormData(file, element.normData), NormTreeNodeType.FILE)
		})]
	}

	private getContents(p: string, paths: string[]): [folders: string[], files: string[]] {
		const folders = new Set<string>()
		const files = new Set<string>()
		for (const pp of paths)
		{
			if (!pp.startsWith(p))
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

	private getNormData(path: string, normData: NormData)
	{
		const newNormData: NormData = {}
		Object.keys(normData).forEach((v)=>{
			if (v.startsWith(path))
				newNormData[v] = normData[v]
		})
		return newNormData
	}
}

class NormTreeNode extends vscode.TreeItem {
	constructor(public readonly label: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState, public path: string, public normData: NormData, public type: NormTreeNodeType, public description?: string) {
		super(label, collapsibleState)
		this.tooltip = `label: ${label} test`
	}
}
