import * as vscode from 'vscode'
import * as util from 'util'
import * as os from 'os'
import { applyDecorations, clearDecorations, updateDecorationColor } from './decorations'
import { IgnoreSystem, initNormignore, isIgnored } from './normignore'
import { execNorminette, NormData } from './norminette'
import { EnvironmentVariables, getEnvironmentVariables } from './getEnvironmentVariables'
import { NorminetteProvider } from './tree'

let outputChannel: vscode.OutputChannel

export function log(...msgs: any[]) {
	if (!outputChannel)
		outputChannel = vscode.window.createOutputChannel('codam-norminette-3')
	outputChannel.appendLine(msgs.map((msg) => typeof msg === 'string' ? msg : util.inspect(msg, false, null, false)).join(' '))
}

async function updateDecorations(editor: vscode.TextEditor, ignores: IgnoreSystem, env: EnvironmentVariables) {
	if (editor.document.uri.scheme != 'file')
		return
	let path = editor.document.uri.path
	if (os.platform() == 'win32') {
		path = path.slice(1) // windows ads a '/' prefix to every path so here we delete it
		if (env.wsl)
			path = path.replace(/^.:/, (m: string) => `/mnt/${m.slice(0, -1).toLowerCase()}`)
	}
	const filename: string = path.replace(/^.*[\\\/]/, '') // possibly just \/ instead of \\\/

	if (!env.regex.test(filename))
		return
	if (ignores && isIgnored(editor.document.uri, ignores))
		return

	log('Executing norminette on:', path)
	const now = Date.now()
	const data = await execNorminette(env, path)
	if (data === 'aborted') {
		vscode.window.showErrorMessage(`Failed to execute norminette within ${env.commandTimeoutMs}ms\n. See https://github.com/Mariusmivw/vscode-42-norminette-3-highlighter/blob/master/common-issues.md`)
		return
	}
	if (data)
		applyDecorations(data, editor, env.ignoreErrors, env.displayErrorName)
	else
		clearDecorations(editor)
	log(`Done in ${Date.now() - now}ms`)
}

export function activate(context: vscode.ExtensionContext) {
	log('Extension activated')
	let enabled: boolean = true
	let env: EnvironmentVariables = getEnvironmentVariables()
	if (!env)
		return
	log(`Config:`, env)

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
		'refresh-tree': () => { }
	}

	const norminetteProvider = new NorminetteProvider(vscode.workspace.workspaceFolders, ignores)
	vscode.window.createTreeView('normTree', {
		treeDataProvider: norminetteProvider
	})
	cmds['refresh-tree'] = () => {
		log(vscode.workspace.workspaceFolders.map(f=>f.uri.path))
		norminetteProvider.updateEntireTree()
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
		if (change.affectsConfiguration('codam-norminette-3'))
			env = getEnvironmentVariables()
			updateDecorationColor()
	}, null, context.subscriptions)

	vscode.workspace.onDidChangeWorkspaceFolders(() => {
		norminetteProvider.setWorkspaceFolders(vscode.workspace.workspaceFolders)
	}, null, context.subscriptions)

	let timeout: NodeJS.Timeout = undefined
	function triggerUpdateDecorations(editor: vscode.TextEditor) {
		if (editor.document.uri.scheme != 'file')
			return
		if (timeout)
			clearTimeout(timeout)
		timeout = setTimeout(() => {
			norminetteProvider.updateTreeItem(editor)
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
