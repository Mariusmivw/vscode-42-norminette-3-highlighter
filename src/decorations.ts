import * as vscode from 'vscode'
import { NormInfo } from './norminette'

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

function isEmptyLineError(line: string)
{
	const emptyLineErrors = [
		'SPACE_EMPTY_LINE',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_FILE_START',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_EOF',
		'CONSECUTIVE_NEWLINES',
	]
	for (const lineError of emptyLineErrors) {
		if (line.includes(lineError)) {
			return true
		}
	}
	return false
}

function getTabOffset(text: String, col: Number)
{
	const tabSplit = text.split('\t')
	let len = 0
	let tabOffset = 0
	for (const part of tabSplit)
	{
		len += part.length
		if (len + tabOffset >= col)
			return tabOffset
		tabOffset += 4 - (len % 4);
		if (len + tabOffset >= col)
			return tabOffset
	}
}

export function applyDecorations(data: NormInfo[], errors: vscode.DecorationOptions[], emptyErrors: vscode.DecorationOptions[], activeEditor: vscode.TextEditor) {
	data.forEach((e) => {
		const decoration = {
			range: null,
			hoverMessage: `**Error: ${e.errorText}**`,
		}
		const line = activeEditor.document.lineAt(e.line)
		const tabOffset = getTabOffset(line.text, e.col);
		const wordRangeAtPosition = activeEditor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col - tabOffset))
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
