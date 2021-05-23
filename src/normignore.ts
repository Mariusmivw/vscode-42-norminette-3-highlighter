import { readFileSync } from 'fs'
import ignore, { Ignore } from 'ignore'
import { dirname, relative } from 'path'
import * as vscode from 'vscode'
import { log } from './extension'

export type IgnoreSystem = { [workspace: string]: { [folder: string]: Ignore } }

export function initNormignore(): IgnoreSystem {
	const ignores: IgnoreSystem = {}

	vscode.workspace.findFiles('**/.normignore').then((fileUris) => {
		for (const fileUri of fileUris) {
			const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
			if (!workspace) return
			log('adding: ' + fileUri.path)
			const ignorePath = dirname(relative(workspace, fileUri.path))
			if (!ignores[workspace])
				ignores[workspace] = {}
			ignores[workspace][ignorePath] = ignore().add(readFileSync(fileUri.fsPath).toString())
		}
	})

	const watcher = vscode.workspace.createFileSystemWatcher('**/.normignore')
	watcher.onDidDelete((fileUri) => {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace) return
		log('removing: ' + fileUri.path)
		const ignorePath = dirname(relative(workspace, fileUri.path))
		if (ignores[workspace] && ignores[workspace][ignorePath])
			delete ignores[workspace][ignorePath]
	})
	watcher.onDidCreate((fileUri) => {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace) return
		log('adding: ' + fileUri.path)
		const ignorePath = dirname(relative(workspace, fileUri.path))
		if (!ignores[workspace])
			ignores[workspace] = {}
		ignores[workspace][ignorePath] = ignore().add(readFileSync(fileUri.fsPath).toString())
	})
	watcher.onDidChange((fileUri) => {
		const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
		if (!workspace) return
		log('changing / replacing: ' + fileUri.path)
		const ignorePath = dirname(relative(workspace, fileUri.path))
		if (!ignores[workspace])
			ignores[workspace] = {}
		ignores[workspace][ignorePath] = ignore().add(readFileSync(fileUri.fsPath).toString())
	})

	return ignores
}

export function isIgnored(fileUri: vscode.Uri, ignores: IgnoreSystem): boolean {
	const workspace = vscode.workspace.getWorkspaceFolder(fileUri).uri.path
	if (!workspace || !ignores[workspace]) return
	const filePath = relative(workspace, fileUri.path)
	const parts = filePath.split('/')
	let folder: string
	for (let dirs = 1; dirs < parts.length + 1; dirs++) {
		const folderToCheck = dirname(parts.slice(0, dirs).join('/'))
		if (ignores[workspace][folderToCheck]) {
			if (folder && ignores[workspace][folder].ignores(relative(folder, folderToCheck) + '/'))
				break
			folder = folderToCheck
		}
	}
	if (!folder)
		return false
	let result = ignores[workspace][folder].test(relative(folder, filePath))
	while (folder != '.' && !result.ignored && !result.unignored) {
		folder = dirname(folder)
		result = ignores[workspace][folder].test(relative(folder, filePath))
	}
	return result.ignored
}
