import * as vscode from 'vscode'
import * as child_process from 'child_process'
import * as os from 'os'

type CommandData = { command: string, wsl: boolean, version: string }

const validNorminetteVersionRegex = /norminette (\d+\.\d+\.\d+)/

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

function versionAtLeast(version: string, atLeast: [number, number, number]): boolean {
	const m = version.match(/(\d+)\.(\d+)\.(\d+)/)
	if (m === null) {
		return false
	}
	const [_, major, minor, patch] = m
	if (parseInt(major) > atLeast[0])
		return true;
	if (parseInt(major) < atLeast[0])
		return false;

	if (parseInt(minor) > atLeast[1])
		return true;
	if (parseInt(minor) < atLeast[1])
		return false;

	if (parseInt(patch) >= atLeast[2])
		return true;
	return false;
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

	const m = stdout.match(validNorminetteVersionRegex)
	if (m === null) {
		vscode.window.showErrorMessage(`Norminette: Could not determine version (output: ${stdout}).`)
		return null
	}
	const [_, version] = m
	if (!versionAtLeast(version, [3, 0, 0])) {
		vscode.window.showErrorMessage(`Norminette: wrong version: ${version}, must be 3.x.x.`)
	}

	let cmd = validCommand
	if (versionAtLeast(version, [3, 3, 57])) {
		cmd += ' --no-colors'
	}

	return { command: cmd, wsl: cmd.startsWith('wsl '), version }
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
