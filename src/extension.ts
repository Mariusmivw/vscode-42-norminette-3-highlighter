import * as vscode from 'vscode'
import { applyDecorations } from './decorations'
import { execNorminette } from './norminette'

function getConfig() {
	return vscode.workspace.getConfiguration('codam-norminette-3')
}

function fetchCommands() {
	const config = getConfig()
	return [
		config.get(`command0`) as string,
		config.get(`command1`) as string,
	]
}

function fetchPatterns() {
	const config = getConfig()
	return [
		RegExp(config.get(`fileregex0`)),
		RegExp(config.get(`fileregex1`)),
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
		}, 500)
	}

	let commands = fetchCommands()
	let patterns = fetchPatterns()
	vscode.workspace.onDidChangeConfiguration((change) => {
		if (change.affectsConfiguration('codam-norminette-3')) {
			commands = fetchCommands()
			patterns = fetchPatterns()
		}
	})

	async function updateDecorations(index: number, errors: vscode.DecorationOptions[], emptyErrors: vscode.DecorationOptions[]) {
		if (!activeEditor) {
			return
		}
		const command = commands[index]
		const filename = activeEditor.document.uri.path.replace(/^.*[\\\/]/, '')
		if (!command || !patterns[index].test(filename)) {
			return
		}

		const data = await execNorminette(activeEditor.document.uri.path, command)
		if (data){
			applyDecorations(data, errors, emptyErrors, activeEditor)
		}
	}
}
