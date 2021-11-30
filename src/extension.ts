import * as vscode from 'vscode'
import { applyDecorations, clearDecorations, updateDecorationColor } from './decorations'
import { IgnoreSystem, initNormignore, isIgnored } from './normignore'
import { execNorminette, NormInfo } from './norminette'
import * as os from 'os'
import { EnvironmentVariables, getEnvironmentVariables } from './getEnvironmentVariables'

let outputChannel: vscode.OutputChannel

export function log(msg: string) {
	if (!outputChannel)
		outputChannel = vscode.window.createOutputChannel('codam-norminette-3')
	outputChannel.appendLine(msg)
}

async function updateDecorations(editor: vscode.TextEditor, ignores: IgnoreSystem, env: EnvironmentVariables) {
	let path = editor.document.uri.path
	if (os.platform() == 'win32') {
		path = path.slice(1); // windows ads a '/' prefix to every path so here we delete it
		if (env.wsl)
			path = path.replace(/^.:/, (m: string) => `/mnt/${m.slice(0, -1).toLowerCase()}`)
	}
	const filename: string = path.replace(/^.*[\\\/]/, '') // possibly just \/ instead of \\\/

	if (!env.regex.test(filename))
		return
	if (ignores && isIgnored(editor.document.uri, ignores))
		return

	log(`Executing norminette on: ${path}`)

	const data: NormInfo[] = await execNorminette(path, env.command)
	log(`norm info: ${JSON.stringify(data)}`)
	if (data)
		applyDecorations(data, editor, env.ignoreErrors)
}

export function activate(context: vscode.ExtensionContext) {
	let enabled: boolean = true
	let env: EnvironmentVariables = getEnvironmentVariables()
	if (!env)
		return
	const ignores: IgnoreSystem = initNormignore()

	const cmds = {
		'enable': () => {
			enabled = true
			for (const editor of vscode.window.visibleTextEditors) {
				updateDecorations(editor, ignores, env)
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
			env = getEnvironmentVariables();
			updateDecorationColor();
		}
	})

	let timeout: NodeJS.Timeout = undefined
	function triggerUpdateDecorations(editor: vscode.TextEditor) {
		if (timeout)
			clearTimeout(timeout)
		timeout = setTimeout(() => {
			if (enabled)
				updateDecorations(editor, ignores, env)
			else
				clearDecorations(editor)
		}, 500) // delay for when switching tabs fast
	}

	for (const cmd in cmds) {
		context.subscriptions.push(vscode.commands.registerCommand(`codam-norminette-3.${cmd}`, cmds[cmd]))
	}

	for (const editor of vscode.window.visibleTextEditors) {
		updateDecorations(editor, ignores, env)
	}
}
