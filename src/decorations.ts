import * as vscode from 'vscode'
import { NormInfo } from './norminette'

const decorations = {
	errors: vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		backgroundColor: 'rgba(255,0,0,0.2)',
	}),
	emptyLine: vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		backgroundColor: 'rgba(255,0,0,0.2)',
		isWholeLine: true,
	}),
}

function isEmptyLineError(line: string): boolean {
	const emptyLineErrors = [
		'SPACE_EMPTY_LINE',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_FILE_START',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_EOF',
		'CONSECUTIVE_NEWLINES',
	]
	for (const lineError of emptyLineErrors) {
		if (line.includes(lineError))
			return true
	}
	return false
}

function getTabOffset(text: string, col: number): number {
	const tabSplit: string[] = text.split('\t')
	let len: number = 0
	let tabOffset: number = 0
	for (const part of tabSplit) {
		len += part.length
		if (len + tabOffset >= col)
			return tabOffset
		tabOffset += 4 - (len % 4)
		if (len + tabOffset >= col)
			return tabOffset
	}
	return tabOffset
}

export function applyDecorations(normInfos: NormInfo[], editor: vscode.TextEditor) {
	const errors: vscode.DecorationOptions[] = []
	const emptyErrors: vscode.DecorationOptions[] = []

	normInfos.forEach((e) => {
		const decoration = {
			range: null,
			hoverMessage: `**Error: ${e.errorText}**`,
		}
		const line: vscode.TextLine = editor.document.lineAt(e.line)
		const tabOffset: number = getTabOffset(line.text, e.col)
		const wordRangeAtPosition: vscode.Range = editor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col - tabOffset))
		if (isEmptyLineError(e.error)) {
			decoration.range = line.range
			emptyErrors.push(decoration)
		}
		else if (!e.col || !wordRangeAtPosition) {
			decoration.range = line.range
			errors.push(decoration)
		}
		else {
			decoration.range = wordRangeAtPosition
			errors.push(decoration)
		}
	})
	editor.setDecorations(decorations.errors, errors)
	editor.setDecorations(decorations.emptyLine, emptyErrors)
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor.setDecorations(decorations.errors, [])
	editor.setDecorations(decorations.emptyLine, [])
}
