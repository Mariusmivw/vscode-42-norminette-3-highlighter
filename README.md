<img
  src="https://raw.githubusercontent.com/Mariusmivw/vscode-42-norminette-3-highlighter/master/42.png"
  width=128>

# 42 Norminette V3.x for VSCode

This extension is a Norminette (version 3.x) decorator for 42 in VSCode
![example](example.gif)
## Install

Launch Quick Open with <kbd>⌘</kbd>+<kbd>P</kbd> and enter
```
ext install codam-norminette-3
```

## Usage

If there are changes to the file, the norm is automatically checked on save


## Configuration

```json
{
  "codam-norminette-3.command0": "norminette",
  "codam-norminette-3.command1": "",
  "codam-norminette-3.fileregex0": "\\.[ch]$",
  "codam-norminette-3.fileregex1": "(\\.[c])|Makefile|makefile|GNUmakefile$"
}
```

## Issues

To report a bug or ask for a feature, please open a [Github issue](https://github.com/Mariusmivw/vscode-42-norminette-3-highlighter/issues)


## License

MIT
