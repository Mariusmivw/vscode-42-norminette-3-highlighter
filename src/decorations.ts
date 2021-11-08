import * as vscode from 'vscode'
import { findMatchingBracket, parseBrackets } from './brackets'
import { NormData } from './norminette'

const decorations = {
	errors: vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		backgroundColor: 'rgba(255,0,0,0.2)',
	}),
	wholeLine: vscode.window.createTextEditorDecorationType({
		overviewRulerColor: 'red',
		overviewRulerLane: vscode.OverviewRulerLane.Right,
		backgroundColor: 'rgba(255,0,0,0.2)',
		isWholeLine: true,
	}),
}

function decorateWholeLine(line: string): boolean {
	const wholeLineErrors = [
		'SPACE_EMPTY_LINE',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_FILE_START',
		'EMPTY_LINE_FUNCTION',
		'EMPTY_LINE_EOF',
		'CONSECUTIVE_NEWLINES',
		'LINE_TOO_LONG',
		'UNRECOGNIZED_TOKEN'
	]
	for (const lineError of wholeLineErrors) {
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

export function applyDecorations(normData: NormData, editor: vscode.TextEditor, ignoreErrors: string[], displayErrorName: boolean) {
	const errors: vscode.DecorationOptions[] = []
	const wholeLineErrors: vscode.DecorationOptions[] = []

	normData[Object.keys(normData)[0]].forEach((e) => {
		if (ignoreErrors.includes(e.error)) return
		const decoration = {
			range: null,
			hoverMessage: `**Error: ${e.errorText}${displayErrorName ? ` *(${e.error})*` : ''}**`,
		}
		const line: vscode.TextLine = editor.document.lineAt(e.line)
		const tabOffset: number = getTabOffset(line.text, e.col)
		const wordRangeAtPosition: vscode.Range = editor.document.getWordRangeAtPosition(new vscode.Position(e.line, e.col - tabOffset))
		if (e.error === 'TOO_MANY_LINES') {
			const startBracket = findMatchingBracket(new vscode.Position(e.line, e.col), parseBrackets(editor.document.getText()))
			decoration.range = editor.document.lineAt(startBracket.line - 1).range
			wholeLineErrors.push(decoration)
		}
		else if (decorateWholeLine(e.error)) {
			decoration.range = line.range
			wholeLineErrors.push(decoration)
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
	editor.setDecorations(decorations.wholeLine, wholeLineErrors)
}

export function clearDecorations(editor: vscode.TextEditor) {
	editor.setDecorations(decorations.errors, [])
	editor.setDecorations(decorations.wholeLine, [])
}
