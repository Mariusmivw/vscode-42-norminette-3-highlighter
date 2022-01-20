import { exec } from 'child_process'

async function execAsync(command): Promise<{ stdout: string, stderr: string } | null> {
	return new Promise((resolve, reject) => {
		exec(`${command}`, (error, stdout, stderr) => {
			resolve({ stdout, stderr })
		})
	})
}

export type NormInfo = {
	fullText: string,
	error: string,
	isNotice: boolean,
	line: number,
	col: number,
	errorText: string
}

export type NormData = {
	[file: string]: NormInfo[]
}

function normDecrypt(normLine: string): NormInfo {
	try {
		const [fullText, error_or_notice, error, line, col, errorText] = normLine.match(/(Error|Notice):\s*([A-Z_]*)\s*\(line:\s*(\d*),\s*col:\s*(\d+)\):\s*(.*)/)
		if (!fullText || !error || !line || !col || !errorText)
			return null
		const result = {
			fullText,
			error,
			isNotice: (error_or_notice == 'Notice'),
			line: parseInt(line) - 1,
			col: parseInt(col) - 1,
			errorText: errorText[0].toUpperCase() + errorText.slice(1)
		}
		return (result)
	}
	catch (e) {
		try {
			const [fullText, token_or_line] = normLine.match(/(?:\s|\033\[.*m)*Error: Unrecognized (token|line) .*/)
			if (token_or_line === 'token') {
				var [_, errorText, line_str, col_str] = normLine.match(/.* (Unrecognized token) line (\d+), col (\d+)/)
				var line = parseInt(line_str) - 1
				var col = parseInt(col_str) - 2
			}
			else if (token_or_line === 'line') {
				const [_, errorText1, line_str, col_str, errorText2] = normLine.match(/.* (Unrecognized line )\((\d+), (\d+)\) (while parsing line)/)
				var errorText = errorText1 + errorText2
				var line = parseInt(line_str) - 1
				var col = parseInt(col_str) - 1
			}
			const result = {
				fullText,
				error: 'UNRECOGNIZED_TOKEN',
				isNotice: false,
				line,
				col,
				errorText
			}
			return (result)
		}
		catch (e) {
			return null
		}
	}
}

export async function execNorminette(path: string, command: string): Promise<NormData | null> {
	const { stdout } = await execAsync(`${command} '${path}'`)
	const lines = stdout.split('\n').slice(0, -1)
	const normDecrypted: NormData = {}
	let currentFile: string
	for (const line of lines) {
		if (/(Error|Notice):/.test(line)) {
			if (line.endsWith('is not valid C or C header file'))
				continue
			// log('line:', line, '\nescaped:', escape(line))
			const decrypted = normDecrypt(line)
			if (decrypted) {
				if (!normDecrypted[currentFile])
					normDecrypted[currentFile] = []
				normDecrypted[currentFile].push(decrypted)
			}
		} else {
			const [_, filename, err_ok] = line.match(/(.*): (Error|OK)!$/)
			currentFile = filename
		}
	}
	if (Object.keys(normDecrypted).length == 0)
		return null
	return normDecrypted
}
