import * as vscode from 'vscode'
import { applyDecorations } from './decorations'
import { execNorminette } from './norminette'

function fetchCommands() {
	return [
		vscode.workspace.getConfiguration('codam-norminette').get(`command0`) as string,
		vscode.workspace.getConfiguration('codam-norminette').get(`command1`) as string,
	]
}

function fetchPatterns() {
	return [
		RegExp(vscode.workspace.getConfiguration('codam-norminette').get(`fileregex0`)),
		RegExp(vscode.workspace.getConfiguration('codam-norminette').get(`fileregex1`)),
	]
}

export function activate(context: vscode.ExtensionContext) {
	let activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		triggerUpdateDecorations()
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor
		if (activeEditor) {
			triggerUpdateDecorations()
		}
	}, null, context.subscriptions)

	vscode.workspace.onDidSaveTextDocument(document => {
		if (activeEditor && document === activeEditor.document) {
			triggerUpdateDecorations()
		}
	}, null, context.subscriptions)

	let timeout = undefined
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout)
		}
		timeout = setTimeout(() => {
			const errors: vscode.DecorationOptions[] = []
			const emptyErrors: vscode.DecorationOptions[] = []
			updateDecorations(0, errors, emptyErrors)
			updateDecorations(1, errors, emptyErrors)
		}, 1000)
	}

	let commands = fetchCommands()
	let patterns = fetchPatterns()
	vscode.workspace.onDidChangeConfiguration((change) => {
		if (change.affectsConfiguration('codam-norminette')) {
			commands = fetchCommands()
			patterns = fetchPatterns()
		}
	})

	async function updateDecorations(index: number, errors, emptyErrors) {
		if (!activeEditor) {
			return
		}
		const command = commands[index]
		const filename = activeEditor.document.uri.path.replace(/^.*[\\\/]/, '')
		if (!command || !patterns[index].test(filename)) {
			return
		}
		const data = await execNorminette(activeEditor.document.uri.path, command)
		applyDecorations(data, errors, emptyErrors, activeEditor)
	}
}
