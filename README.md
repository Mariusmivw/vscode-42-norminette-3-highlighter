<img src="https://raw.githubusercontent.com/Mariusmivw/vscode-42-norminette-3-highlighter/master/img/42.png" width=128>

# 42 Norminette V3.x for VSCode
This extension is a Norminette (version 3.x) decorator for 42 in VSCode\
![example](img/example.gif)

## Installation
This extension can be found at:
[The VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=MariusvanWijk-JoppeKoers.codam-norminette-3) and [The OpenVSX Marketplace](https://open-vsx.org/extension/MariusvanWijk-JoppeKoers/codam-norminette-3)

Or launch Quick Open with <kbd>⌘</kbd>+<kbd>P</kbd> and enter
```
ext install codam-norminette-3
```

This extension can also be installed from a VSIX package, which can be found on the [Releases page](https://github.com/Mariusmivw/vscode-42-norminette-3-highlighter/releases/latest). Open the Command Pallette (<kbd>⌘</kbd>+<kbd>Shift</kbd>+<kbd>P</kbd>) and search for `VSIX`.

## Usage

If there are changes to the file, the norm is automatically checked on save

To enable or disable the highlighter you can press <kbd>Shift</kbd>+<kbd>⌘</kbd>+<kbd>p</kbd>\
![enable|disable|toggle](img/enable.gif)

## Features
### Normignore
If you want to ignore norminette errors in specific files in your project you can add a `.normignore` file.
This files works in the same way as a `.gitignore` file.

### Tree view
View a summary of all the Norminette errors in your workspace.\
<img src="https://raw.githubusercontent.com/Mariusmivw/vscode-42-norminette-3-highlighter/master/img/tree.gif" width=500>


### Settings
In VSCode's settings.json you can add these lines if you want custom configuration
```json5
{
	"codam-norminette-3.command": "norminette", // command to execute norminette
	"codam-norminette-3.fileregex": "\\.[ch]$", // regex that matches the files you want to norm check
	"codam-norminette-3.ignoreErrors": [ // do not highlight these norm errors
		// "WRONG_SCOPE_COMMENT",
		// "LINE_TOO_LONG"
	],
	"codam-norminette-3.displayErrorName": false // display name of error on hover
}
```

## Issues
To report a bug or ask for a feature, please open a [Github issue](https://github.com/Mariusmivw/vscode-42-norminette-3-highlighter/issues)

## License
MIT
