import * as vscode from 'vscode'
import { exec } from 'child_process'

export function activate(context: vscode.ExtensionContext) {

	const errorsDecoration = vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		backgroundColor: 'rgba(255,0,0,0.2)',
	})

	let activeEditor = vscode.window.activeTextEditor
	if (activeEditor) {
		triggerUpdateDecorations()
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor
		if (editor) {
			triggerUpdateDecorations()
		}
	}, null, context.subscriptions)

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations()
		}
	}, null, context.subscriptions)

	var timeout = undefined
	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout)
		}
		timeout = setTimeout(updateDecorations, 500)
	}

	function updateDecorations() {
		if (!activeEditor || (activeEditor.document.languageId !== "c" && activeEditor.document.languageId !== "makefile")) {
			return
		}
		let command = vscode.workspace.getConfiguration('codam-norminette').get('command') as string;
		let command2 = vscode.workspace.getConfiguration('codam-norminette').get('command2') as string;
		let regex = vscode.workspace.getConfiguration('codam-norminette').get('fileregex') as string;
		let pattern = RegExp(regex);
		let regex2 = vscode.workspace.getConfiguration('codam-norminette').get('fileregex2') as string;
		let pattern2 = RegExp(regex2);

		const errors: vscode.DecorationOptions[] = []
		if (command && activeEditor.document.uri.path.replace(/^.*[\\\/]/, '').match(pattern)) {
				runNorminetteProccess(activeEditor.document.uri.path, command)
					.then((data: Array<any>) => {
						data.forEach(e => {
							let range
							let decoration
							if (!e.col || !activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col))) {
								range = activeEditor.document.lineAt(e.line).range
								decoration = { range: range, hoverMessage: 'Error: **' + e.errorText + '**' }
							}
							else {
								range = activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col))
								decoration = { range: range, hoverMessage: 'Error: **' + e.errorText + '**' }
							}
							errors.push(decoration)
						})
						activeEditor.setDecorations(errorsDecoration, errors)
					})
				}
		if (command2 && activeEditor.document.uri.path.replace(/^.*[\\\/]/, '').match(pattern2)) {
				runNorminetteProccess(activeEditor.document.uri.path, command2)
					.then((data: Array<any>) => {
						data.forEach(e => {
							let range
							let decoration
							if (!e.col || !activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col))) {
								range = activeEditor.document.lineAt(e.line).range
								decoration = { range: range, hoverMessage: 'Error: **' + e.errorText + '**' }
							}
							else {
								range = activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col))
								decoration = { range: range, hoverMessage: 'Error: **' + e.errorText + '**' }
							}
							errors.push(decoration)
						})
						activeEditor.setDecorations(errorsDecoration, errors)
					})
			}
	}

	function runNorminetteProccess(filename: String, command: String) {
		console.log(filename)
		return new Promise((resolve, reject) => {
			const line = []
			const normDecrypted = []
			const proc = exec(command + " " +  filename, function (error, stdout, stderr) {
				stdout.split('\n').forEach((e, i) => {
					if (i == 0)
						return;
					line.push(e)
				})
			})
			proc.on('close', (exitCode) => {
				try {
					line.pop()
					line.forEach((e) => {
						normDecrypted.push(normDecrypt(e))
					})
					console.log(normDecrypted)
					resolve(normDecrypted)
				} catch (e) {console.log(e)}
			})
		})
	}

	function normDecrypt(normLine: String) {
		let line, col
		const array = normLine.split(":")[0].match(/[0-9]+/g)
		if (array)
			[line, col] = array.map(e => +e)
		const ob =  {
			line: line < 0 ? 0 : line-1 || 0,
			col,
			fullText: normLine,
			errorText: normLine.split(":")[1]
		}
		return ob;
	}
}
