import * as vscode from 'vscode'
import * as child_process from 'child_process'
import * as os from 'os'

type CommandData = { command: string, wsl: boolean }

const validNorminetteVersionRegex = /norminette 3\.\d+\.\d+/

/**
 * Checks if the command is valid by running it with the -v flag.
 * If the command is not found, it will try to run it with WSL if on Windows.
 * @returns {string | null} The command if valid and with WSL if needed, null otherwise.
 */
function getValidCommand(command: string): string | null {
	try {
		child_process.execSync(`${command} -v`).toString()
		return command
	} catch {
		if (os.platform() == 'win32' && !command.startsWith('wsl ')) {
			try {
				child_process.execSync(`wsl ${command} -v`).toString()
				return `wsl ${command}`
			} catch {}
		}
	}
	return null
}

/**
 * Validates the command by checking if it is available and if the version is correct.
 */
function validateCommand(command: string): CommandData | null {
	let validCommand = getValidCommand(command)

	if (!validCommand) {
		vscode.window.showErrorMessage(`Norminette: \`${command}' not found, see https://github.com/42School/norminette for installation instructions.`)
		return null
	}

	const stdout = child_process.execSync(`${validCommand} -v`).toString()

	if (!validNorminetteVersionRegex.test(stdout)) {
		vscode.window.showErrorMessage(`Norminette: wrong version: ${stdout}, must be 3.x.x.`)
		return null
	}

	return { command: validCommand, wsl: command.startsWith('wsl ') }
}

export type EnvironmentVariables = {
	command: string,
	commandTimeoutMs: number,
	wsl: boolean,
	regex: RegExp,
	ignoreErrors: string[],
	displayErrorName: boolean
}
export function getEnvironmentVariables(): EnvironmentVariables | null {
	const workspaceConfiguration = vscode.workspace.getConfiguration('codam-norminette-3')
	const command = validateCommand(workspaceConfiguration.get('command'))
	if (!command)
		return null
	return {
		command: command.command,
		commandTimeoutMs: Number(workspaceConfiguration.get(`commandTimeoutMs`) || 10_000),
		wsl: command.wsl,
		regex: new RegExp(workspaceConfiguration.get(`regex`)),
		ignoreErrors: workspaceConfiguration.get(`ignoreErrors`) as string[],
		displayErrorName: workspaceConfiguration.get(`displayErrorName`) as boolean
	}
}
