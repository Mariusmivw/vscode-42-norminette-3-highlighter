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
		if (!activeEditor && activeEditor.document.languageId !== "c") {
			return
		}

		const errors: vscode.DecorationOptions[] = []
		runNorminetteProccess(activeEditor.document.uri.path)
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

	function runNorminetteProccess(filename: String) {
		console.log(filename)
		return new Promise((resolve, reject) => {
			const line = []
			const normDecrypted = []
			const proc = exec('norminette ' + filename, function (error, stdout, stderr) {
				console.log(stdout)
				stdout.split('\n').forEach((e, i) => {
					if (i == 0)
						return;
					const tb = e.split(":").splice(1)
					let str = "";
					tb.forEach(e => str += ":" + e)
					line.push(str)
				})
			})
			proc.on('close', (exitCode) => {
				try {
					console.log("HI\n")
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
		console.log(normLine)
		const [line, col] = normLine.split(":")[1].match(/[0-9]+/g).map(e => +e)
		return {
			line: line < 0 ? 0 : line-1 || 0,
			col,
			fullText: normLine,
			errorText: normLine.split(":")[2]
		}
	}
}