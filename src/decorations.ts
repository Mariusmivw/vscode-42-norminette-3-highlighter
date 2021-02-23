import * as vscode from 'vscode'

const errors = vscode.window.createTextEditorDecorationType({
	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	backgroundColor: 'rgba(255,0,0,0.2)',
})

const emptyLine = vscode.window.createTextEditorDecorationType({
	overviewRulerColor: 'red',
	overviewRulerLane: vscode.OverviewRulerLane.Right,
	backgroundColor: 'rgba(255,0,0,0.2)',
	isWholeLine: true,
})

const decorations = {
	errors,
	emptyLine,
}

export function applyDecorations(data, errors, emptyErrors, activeEditor) {
	data.forEach((e) => {
		const decoration = {
			range: null,
			hoverMessage: `**Error: ${e.errorText}**`,
		}
		if (e.errorText.search(/empty line/i) != -1) {
			decoration.range = activeEditor.document.lineAt(e.line).range;
			emptyErrors.push(decoration)
		}
		else if (!e.col || !activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col))) {
			decoration.range = activeEditor.document.lineAt(e.line).range,
			errors.push(decoration)
		}
		else {
			decoration.range = activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col))
			errors.push(decoration)
		}
	})
	activeEditor.setDecorations(decorations.errors, errors)
	activeEditor.setDecorations(decorations.emptyLine, emptyErrors)
}

