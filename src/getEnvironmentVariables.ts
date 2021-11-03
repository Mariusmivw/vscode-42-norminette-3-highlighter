import * as vscode from 'vscode'
import * as child_process from 'child_process'
import * as os from 'os'

type CommandData = { command: string, wsl: boolean }
function validateCommand(command: string): CommandData | null {
	try {
		const stdout = child_process.execSync(`${command} -v`).toString()
		if (!(/3\.\d+\.\d+\s*$/.test(stdout))) {
			vscode.window.showErrorMessage(`Nominette: wrong version: ${stdout}, must be 3.x.x.`)
			return null
		}
	}
	catch {
		if (os.platform() == 'win32') {
			try {
				const stdout = child_process.execSync(`wsl ${command} -v`).toString()
				if (!(/3\.\d+\.\d+\s*$/.test(stdout)))
					vscode.window.showErrorMessage(`Nominette: wrong version: ${stdout}, must be 3.x.x.`)
				return { command: `wsl ${command}`, wsl: true }
			} catch { }
		}
		vscode.window.showErrorMessage(`Norminette: \`${command}' not found, see https://github.com/42School/norminette for installation instructions.`)
		return null
	}
	return { command, wsl: command.startsWith('wsl ') }
}

export type EnvironmentVariables = {
	command: string,
	wsl: boolean,
	regex: RegExp,
	ignoreErrors: string[]
}
export function getEnvironmentVariables(): EnvironmentVariables | null {
	const workspaceConfiguration = vscode.workspace.getConfiguration('codam-norminette-3')
	const command = validateCommand(workspaceConfiguration.get('command'))
	if (!command)
		return null
	return {
		command: command.command,
		wsl: command.wsl,
		regex: new RegExp(workspaceConfiguration.get(`regex`)),
		ignoreErrors: workspaceConfiguration.get(`ignoreErrors`) as string[]
	}
}
