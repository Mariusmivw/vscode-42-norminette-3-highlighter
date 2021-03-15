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

function isEmptyLineError(line :string)
{
	const emptyLineErrors = [
		'SPACE_EMPTY_LINE',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_FILE_START',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_EOF',
		'CONSECUTIVE_NEWLINES',
	]
	for (const lineError of emptyLineErrors)
	{
		if (line.includes(lineError)) {
			return true
		}
	}
	return false
}

export function applyDecorations(data, errors, emptyErrors, activeEditor) {
	data.forEach((e) => {
		const decoration = {
			range: null,
			hoverMessage: `**Error: ${e.errorText}**`,
		}
		const line = activeEditor.document.lineAt(e.line)
		const offsetByTabs = (line.text.split('\t').length - 1) * 3
		const wordRangeAtPosition = activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col - offsetByTabs))
		if (isEmptyLineError(e.error)) {
			decoration.range = line.range;
			emptyErrors.push(decoration)
		}
		else if (!e.col || !wordRangeAtPosition) {
			decoration.range = line.range,
			errors.push(decoration)
		}
		else {
			decoration.range = wordRangeAtPosition
			errors.push(decoration)
		}
	})
	activeEditor.setDecorations(decorations.errors, errors)
	activeEditor.setDecorations(decorations.emptyLine, emptyErrors)
}
