import { readFileSync } from 'fs'
import ignore, { Ignore } from 'ignore'
import * as path from 'path'
import * as vscode from 'vscode'
import { log } from './extension'

export type IgnoreSystem = { ignored: string[], notIgnored: string[], workspaces: { [workspace: string]: { [folder: string]: Ignore } } }

export function initNormignore(): IgnoreSystem {
	const ignores: IgnoreSystem = { ignored: [], notIgnored: [], workspaces: {} }

	vscode.workspace.findFiles('**/.normignore').then((fileUris) => {
		for (const fileUri of fileUris) {
			const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
			if (!workspace) return
			log('adding: ' + fileUri.path)
			const ignorePath = path.dirname(path.relative(workspace, fileUri.path))
			if (!ignores.workspaces[workspace])
				ignores.workspaces[workspace] = {}
			ignores.workspaces[workspace][ignorePath] = ignore().add(readFileSync(fileUri.fsPath).toString())
		}
	})

	const watcher = vscode.workspace.createFileSystemWatcher('**/.normignore')
	watcher.onDidDelete((fileUri) => {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace) return
		log('removing: ' + fileUri.path)
		ignores.ignored = []
		ignores.notIgnored = []
		const ignorePath = path.dirname(path.relative(workspace, fileUri.path))
		if (ignores.workspaces[workspace] && ignores.workspaces[workspace][ignorePath])
			delete ignores.workspaces[workspace][ignorePath]
	})
	watcher.onDidCreate((fileUri) => {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace) return
		log('adding: ' + fileUri.path)
		ignores.ignored = []
		ignores.notIgnored = []
		const ignorePath = path.dirname(path.relative(workspace, fileUri.path))
		if (!ignores.workspaces[workspace])
			ignores.workspaces[workspace] = {}
		ignores.workspaces[workspace][ignorePath] = ignore().add(readFileSync(fileUri.fsPath).toString())
	})
	watcher.onDidChange((fileUri) => {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace) return
		log('changing / replacing: ' + fileUri.path)
		ignores.ignored = []
		ignores.notIgnored = []
		const ignorePath = path.dirname(path.relative(workspace, fileUri.path))
		if (!ignores.workspaces[workspace])
			ignores.workspaces[workspace] = {}
		ignores.workspaces[workspace][ignorePath] = ignore().add(readFileSync(fileUri.fsPath).toString())
	})

	return ignores
}

export function isIgnored(fileUri: vscode.Uri, ignores: IgnoreSystem): boolean {
	const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
	if (!workspace || !ignores.workspaces[workspace])
		return false
	const filePath = path.relative(workspace, fileUri.path)
	if (ignores.ignored.includes(filePath))
		return true
	if (ignores.notIgnored.includes(filePath))
		return false
	const parts = filePath.split('/')
	let folder: string
	for (let dirs = 1; dirs < parts.length + 1; dirs++) {
		const folderToCheck = path.dirname(parts.slice(0, dirs).join('/'))
		if (ignores.workspaces[workspace][folderToCheck]) {
			if (folder && ignores.workspaces[workspace][folder].ignores(path.relative(folder, folderToCheck) + '/'))
				break
			folder = folderToCheck
		}
	}
	if (!folder)
		return false
	let result = ignores.workspaces[workspace][folder].test(path.relative(folder, filePath))
	while (folder != '.' && !result.ignored && !result.unignored) {
		folder = path.dirname(folder)
		result = ignores.workspaces[workspace][folder].test(path.relative(folder, filePath))
	}
	return result.ignored
}
