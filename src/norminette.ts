import { exec } from 'child_process'
import { log } from './extension'

export type NormInfo = {
	fullText: string,
	error: string,
	line: number,
	col: number,
	errorText: string
}

function normDecrypt(normLine: string): NormInfo {
	const [fullText, error, line, col, errorText] = normLine.match(/\s*([A-Z_]*)\s*\(line:\s*(\d*),\s*col:\s*(\d+)\):\s*(.*)/)

	return {
		fullText,
		error,
		line: parseInt(line) - 1,
		col: parseInt(col) - 1,
		errorText: errorText[0].toUpperCase() + errorText.slice(1)
	}
}

export function execNorminette(filename: string, command: string): Promise<NormInfo[] | null> {
	return new Promise<NormInfo[]>((resolve, reject) => {
		const lines: string[] = []
		const normDecrypted: NormInfo[] = []
		const proc = exec(`${command} '${filename}'`, (error, stdout, stderr) => {
			stdout.split('\n').forEach((error_line, i) => {
				if (i == 0)
					return
				log(`error line: ${error_line}`)
				lines.push(error_line)
			})
		})
		proc.on('close', (exitCode) => {
			try {
				lines.pop()
				lines.forEach((error_line) => {
					log(`line: ${error_line}`)
					normDecrypted.push(normDecrypt(error_line))
				})
				// console.log(normDecrypted)
				resolve(normDecrypted)
			}
			catch (e) {
				resolve(null)
				// console.log('error')
				// console.log(e)
			}
		})
	})
}
