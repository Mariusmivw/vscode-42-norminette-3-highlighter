import * as vscode from 'vscode'
import * as child_process from 'child_process'
import { applyDecorations, clearDecorations } from './decorations'
import { IgnoreSystem, initNormignore, isIgnored } from './normignore'
import { execNorminette, NormInfo } from './norminette'

function getConfig(): vscode.WorkspaceConfiguration {
	return vscode.workspace.getConfiguration('codam-norminette-3')
}

function fetchCommand(): string {
	const command = getConfig().get(`command`) as string
	try {
		const stdout = child_process.execSync(`${command} -v`).toString()
		if (!(/3\.\d+\.\d+\s*$/.test(stdout)))
			vscode.window.showErrorMessage(`Wrong version: ${stdout}, must be 3.x.x`)
	} catch {
		vscode.window.showErrorMessage(`Norminette: ${command} not found. Maybe try the absolute path`)
		return null
	}
	return command
}

function fetchPattern(): RegExp {
	return new RegExp(getConfig().get(`regex`) as string)
}

function fetchIgnoreErrors(): string[] {
	return getConfig().get(`ignoreErrors`) as string[]
}

let outputChannel: vscode.OutputChannel
export function log(msg: string)
{
	if (!outputChannel)
		outputChannel = vscode.window.createOutputChannel('codam-norminette-3')
	outputChannel.appendLine(msg)
}

async function updateDecorations(editor: vscode.TextEditor, command: string, pattern: RegExp, ignores: IgnoreSystem, ignoreErrors: string[]) {
	if (!editor || !command) return

	const filename: string = editor.document.uri.path.replace(/^.*[\\\/]/, '') // possibly just \/ instead of \\\/

	if (!pattern.test(filename)) return
	if (ignores && isIgnored(editor.document.uri, ignores)) return

	log(`Executing norminette on: ${editor.document.uri.path}`)

	const data: NormInfo[] = await execNorminette(editor.document.uri.path, command)
	log(`norm info: ${JSON.stringify(data)}`)
	if (data) applyDecorations(data, editor, ignoreErrors)
}

export function activate(context: vscode.ExtensionContext) {
	let enabled: boolean = true
	let command: string = fetchCommand()
	let pattern: RegExp = fetchPattern()
	let ignoreErrors: string[] = fetchIgnoreErrors()
	const ignores: IgnoreSystem = initNormignore()
	const cmds = {
		'enable': () => {
			enabled = true
			for (const editor of vscode.window.visibleTextEditors) {
				updateDecorations(editor, command, pattern, ignores, ignoreErrors)
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
			ignoreErrors = fetchIgnoreErrors()
		}
	})

	let timeout: NodeJS.Timeout = undefined
	function triggerUpdateDecorations(editor: vscode.TextEditor) {
		if (timeout)
			clearTimeout(timeout)
		timeout = setTimeout(() => {
			if (enabled)
				updateDecorations(editor, command, pattern, ignores, ignoreErrors)
			else
				clearDecorations(editor)
		}, 500) // delay for when switching tabs fast
	}

	for (const cmd in cmds) {
		context.subscriptions.push(vscode.commands.registerCommand(`codam-norminette-3.${cmd}`, cmds[cmd]))
	}

	for (const editor of vscode.window.visibleTextEditors) {
		updateDecorations(editor, command, pattern, ignores, ignoreErrors)
	}
}
