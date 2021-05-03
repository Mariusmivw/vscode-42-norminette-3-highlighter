<img
  src="https://raw.githubusercontent.com/Mariusmivw/vscode-42-norminette-3-highlighter/master/42.png"
  width=128>

# 42 Norminette V3.x for VSCode

This extension is a Norminette (version 3.x) decorator for 42 in VSCode
![example](example.gif)
## Install

This extension can be found at:
[The VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=MariusvanWijk-JoppeKoers.codam-norminette-3) and [The OpenVSX Marketplace](https://open-vsx.org/extension/MariusvanWijk-JoppeKoers/codam-norminette-3)

Or launch Quick Open with <kbd>⌘</kbd>+<kbd>P</kbd> and enter
```
ext install codam-norminette-3
```

## Usage

If there are changes to the file, the norm is automatically checked on save

To enable or disable the highlighter you can press <kbd>Shift</kbd>+<kbd>⌘</kbd>+<kbd>P</kbd>
![enable|disable|toggle](enable.gif)

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
