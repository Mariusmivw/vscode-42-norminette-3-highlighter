import * as vscode from 'vscode'

export function parseBrackets(text: string | Buffer): vscode.Range[] {
	if (text instanceof Buffer)
		text = text.toString()
	const lines = text.split('\n')
	const bracketPairs: vscode.Range[] = []
	let endPos: [col: number, line: number] | false = [0, 0]
	while (endPos != false)
		endPos = skipBrackets(endPos[0], endPos[1], lines, bracketPairs)
	return bracketPairs
}

function skipBrackets(index: number, lineIndex: number, lines: string[], bracketPairs: vscode.Range[]): [col: number, line: number] | false {
	let hasStartBracket = false
	let startBracket: vscode.Position
	lines[lineIndex] = lines[lineIndex].slice(index)
	for (let i = lineIndex; i < lines.length; i++) {
		let line = lines[i]
		if (line.length == 0)
			continue

		const singleCommentIndex = line.indexOf('//')
		const multiCommentIndex = line.indexOf('/*')
		const doubleQuoteIndex = line.indexOf('\"')
		const singleQuoteIndex = line.indexOf('\'')
		const bracketOpenIndex = line.indexOf('{')

		let earliestInterruptor = singleCommentIndex
		if ((multiCommentIndex > 0 && multiCommentIndex < earliestInterruptor) || earliestInterruptor < 0)
			earliestInterruptor = multiCommentIndex
		if ((doubleQuoteIndex > 0 && doubleQuoteIndex < earliestInterruptor) || earliestInterruptor < 0)
			earliestInterruptor = doubleQuoteIndex
		if ((singleQuoteIndex > 0 && singleQuoteIndex < earliestInterruptor) || earliestInterruptor < 0)
			earliestInterruptor = singleQuoteIndex
		if (hasStartBracket && ((bracketOpenIndex > 0 && bracketOpenIndex < earliestInterruptor) || earliestInterruptor < 0))
			earliestInterruptor = bracketOpenIndex

		let bracketIndex: number = hasStartBracket ? line.indexOf('}') : bracketOpenIndex

		if (earliestInterruptor >= 0 && (earliestInterruptor < bracketIndex || bracketIndex < 0)) {
			let skipPos: [col: number, line: number] | false = false
			if (earliestInterruptor == singleCommentIndex)
				continue
			if (earliestInterruptor == multiCommentIndex)
				skipPos = skipMultiComment(multiCommentIndex, i, lines)
			else if (earliestInterruptor == doubleQuoteIndex)
				skipPos = skipDoubleQuote(doubleQuoteIndex, i, lines)
			else if (earliestInterruptor == singleQuoteIndex)
				skipPos = skipSingleQuote(singleQuoteIndex, i, lines)
			else if (earliestInterruptor == bracketOpenIndex)
				skipPos = skipBrackets(bracketOpenIndex, i, lines, bracketPairs)
			if (skipPos == false)
				break
			lines[skipPos[1]] = line.slice(skipPos[0])
			i = skipPos[1] - 1
			continue
		}

		if (bracketIndex >= 0) {
			if (i == lineIndex)
				bracketIndex += index
			if (hasStartBracket) {
				bracketPairs.push(new vscode.Range(startBracket, new vscode.Position(i, bracketIndex)))
				return [bracketIndex + 1, i]
			}
			startBracket = new vscode.Position(i, bracketIndex)
			hasStartBracket = true
		}
	}
	return false
}

function skipMultiComment(index: number, lineIndex: number, lines: string[]): [col: number, line: number] | false {
	let endIndex = lines[lineIndex].slice(index + 2).indexOf('*/')
	if (endIndex >= 0)
		return [index + 2 + endIndex + 2, lineIndex]
	for (let i = lineIndex + 1; i < lines.length; i++) {
		endIndex = lines[lineIndex].indexOf('*/')
		if (endIndex >= 0)
			return [endIndex + 2, lineIndex]
	}
	return false
}

function skipDoubleQuote(index: number, lineIndex: number, lines: string[]): [col: number, line: number] | false {
	const skipPos = skipUntilUnescapedString('\"', index + 1, lineIndex, lines)
	if (skipPos == false)
		return false
	skipPos[0] += 1
	return skipPos
}

function skipSingleQuote(index: number, lineIndex: number, lines: string[]): [col: number, line: number] | false {
	const skipPos = skipUntilUnescapedString('\'', index + 1, lineIndex, lines)
	if (skipPos == false)
		return false
	skipPos[0] += 1
	return skipPos
}

function skipUntilUnescapedString(str: string, index: number, lineIndex: number, lines: string[]): [col: number, line: number] | false {
	let endIndex = -1
	do {
		index += endIndex + 1
		endIndex = lines[lineIndex].slice(index).indexOf(str)
	} while (endIndex >= 0 && lines[lineIndex][index + endIndex - 1] == '\\' && lines[lineIndex][index + endIndex - 2] != '\\')

	if (endIndex >= 0)
		return [endIndex + index, lineIndex]
	for (let i = lineIndex + 1; i < lines.length; i++) {
		endIndex = lines[lineIndex].indexOf(str)
		if (endIndex >= 0)
			return [endIndex, lineIndex]
	}
	return false
}
