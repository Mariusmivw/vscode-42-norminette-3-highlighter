<img
  src="https://raw.githubusercontent.com/Mariusmivw/vscode-codam-norminette-3/master/codam.png"
  width=128>

# Codam Norminette V3.x for VSCode

This extension is a Norminette (version 3.x) decorator for Codam in VSCode

## Install

Launch Quick Open with <kbd>⌘</kbd>+<kbd>P</kbd> and enter
```
ext install codam-norminette-3
```

## Usage

If there are changes to the file, the norm is automatically checked on save


## Configuration

```ts
{
  "codam-norminette.command0": "norminette",
  "codam-norminette.command1": "",
  "codam-norminette.fileregex0": "\\.[ch]$",
  "codam-norminette.fileregex1": "(\\.[c])|Makefile|makefile|GNUmakefile$"
}
```

## Issues

To report a bug or ask for a feature, please open a [Github issue](https://github.com/Mariusmivw/vscode-codam-norminette-3/issues)


## License

MIT
