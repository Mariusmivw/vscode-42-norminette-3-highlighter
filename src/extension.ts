import * as vscode from 'vscode'
import { applyDecorations, clearDecorations } from './decorations'
import { execNorminette, NormInfo } from './norminette'

function getConfig(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('codam-norminette-3')
}

function fetchCommand(): string {
	return getConfig().get(`command0`) as string
}

function fetchPattern(): RegExp {
	return new RegExp(getConfig().get(`regex0`) as string)
}

async function updateDecorations(editor: vscode.TextEditor, command: string, pattern: RegExp) {
	if (!editor) return

	const filename: string = editor.document.uri.path.replace(/^.*[\\\/]/, '')
	if (!command || !pattern.test(filename)) return

	const data: NormInfo[] = await execNorminette(editor.document.uri.path, command)
	if (data) applyDecorations(data, editor)
}

export function activate(context: vscode.ExtensionContext) {
	let enabled: boolean = true
	let command: string = fetchCommand()
	let pattern: RegExp = fetchPattern()
	const cmds = {
		'enable': () => {
			enabled = true
			for (const editor of vscode.window.visibleTextEditors) {
				updateDecorations(editor, command, pattern)
			}
		},
		'disable': () => {
			enabled = false
			for (const editor of vscode.window.visibleTextEditors) {
				clearDecorations(editor)
			}
		},
		'toggle': () => {
			if (enabled)
				cmds.disable()
			else
				cmds.enable()
		},
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		if (editor)
			triggerUpdateDecorations(editor)
	}, null, context.subscriptions)

	vscode.workspace.onDidSaveTextDocument(document => {
		const editor = vscode.window.visibleTextEditors.find((editor) => editor.document === document)
		if (editor)
			triggerUpdateDecorations(editor)
	}, null, context.subscriptions)

	vscode.workspace.onDidChangeConfiguration((change) => {
		if (change.affectsConfiguration('codam-norminette-3')) {
			command = fetchCommand()
			pattern = fetchPattern()
		}
	})

	let timeout: NodeJS.Timeout = undefined
	function triggerUpdateDecorations(editor: vscode.TextEditor) {
		if (timeout)
			clearTimeout(timeout)
		timeout = setTimeout(() => {
			if (enabled)
				updateDecorations(editor, command, pattern)
			else
				clearDecorations(editor)
		}, 500) // delay for when switching tabs fast
	}

	for (const cmd in cmds) {
		context.subscriptions.push(vscode.commands.registerCommand(`codam-norminette-3.${cmd}`, cmds[cmd]))
	}

	for (const editor of vscode.window.visibleTextEditors) {
		updateDecorations(editor, command, pattern)
	}
}
