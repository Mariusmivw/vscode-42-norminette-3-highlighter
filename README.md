<img
  src="https://raw.githubusercontent.com/thijsdejong/vscode-codam-norminette/master/codam.png"
  width=128>

# Codam Norminette for VSCode

This extension provides is a Norminette decorator for Codam in VSCode

## Install

Launch Quick Open with <kbd>⌘</kbd>+<kbd>P</kbd> and enter
```
ext install codam-norminette
```

If you want to integrate norminette+, check install instructions via bit.ly/norminette

After installation, configure `codam-norminette.command2` in VSCode to point to norminette+ (default `python ~/norminette+/run.py`)

## Usage

If there are changes to the file, the norm is automatically checked on save


## Configuration

```ts
{
  "codam-norminette.command": "norminette",
  "codam-norminette.command2": "",
  "codam-norminette.fileregex": "\\.[ch]$",
  "codam-norminette.fileregex2": "(\\.[ch])|Makefile|makefile|GNUmakefile$"
}
```

## Issues

To report a bug or ask for a feature, please open a [Github issue](https://github.com/thijsdejong/vscode-codam-norminette/issues)


## License

MIT
