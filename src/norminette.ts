import { exec } from 'child_process'
import { log } from './extension'

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
	line: number,
	col: number,
	errorText: string
}

export type NormData = {
	[file: string]: NormInfo[]
}

function normDecrypt(normLine: string): NormInfo {
	try {
		const [fullText, error, line, col, errorText] = normLine.match(/\s*([A-Z_]*)\s*\(line:\s*(\d*),\s*col:\s*(\d+)\):\s*(.*)/)
		if (!fullText || !error || !line || !col || !errorText)
			return null
		const result = {
			fullText,
			error,
			line: parseInt(line) - 1,
			col: parseInt(col) - 1,
			errorText: errorText[0].toUpperCase() + errorText.slice(1)
		}
		return (result)
	}
	catch (e) {
		try {
			const [fullText, errorText, line, col] = normLine.match(/(?:\s|\033\[.*m)*Error: (Unrecognized token) line (\d+), col (\d+)/)
			const result = {
				fullText,
				error: 'UNRECOGNIZED_TOKEN',
				line: parseInt(line) - 1,
				col: parseInt(col) - 2,
				errorText
			}
			return (result)
		}
		catch (e) {
			return null
		}
	}
}

export async function execNorminette(path: string, command: string): Promise<NormData> {
	const { stdout } = await execAsync(`${command} '${path}'`)
	const lines = stdout.split('\n').slice(1, -1)
	const normDecrypted: NormInfo[] = []
	const newNormDecrypted: NormData = {}
	let currentFile: string
	for (const line of lines) {
		if (/Error:/.test(line))
		{
			if (line.endsWith('is not valid C or C header file'))
				continue
			log(`line: ${line}\n\t(${escape(line)})`)
			const decrypted = normDecrypt(line)
			if (decrypted)
			{
				normDecrypted.push(decrypted)
				if (!newNormDecrypted[currentFile])
					newNormDecrypted[currentFile] = []
				newNormDecrypted[currentFile].push(decrypted)
			}
		} else {
			const [_, filename, err_ok] = line.match(/(.*): (Error|OK)!$/)
			currentFile = filename
		}
	}
	return newNormDecrypted
}
