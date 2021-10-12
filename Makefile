# **************************************************************************** #
#                                                                              #
#                                                         ::::::::             #
#    Makefile                                           :+:    :+:             #
#                                                      +:+                     #
#    By: mvan-wij <mvan-wij@student.codam.nl>         +#+                      #
#                                                    +#+                       #
#    Created: 2021/02/24 13:33:13 by mvan-wij      #+#    #+#                  #
#    Updated: 2021/10/12 16:05:56 by mvan-wij      ########   odam.nl          #
#                                                                              #
# **************************************************************************** #

NPM_RUN = npm run
# NPM_RUN = yarn
SECRETS_DECRYPT = secrets.mk
SECRETS_FILE = $(SECRETS_DECRYPT).gpg

VSCE = npx vsce
OVSX = npx ovsx

help:
	@echo "Possible commands:"
	@echo "\thelp:			Shows this help message"
	@echo "\tdecrypt:		Decrypt secrets"
	@echo "\tpublish:		Publishes the extension to both marketplaces"
	@echo "\tcompile:		Compiles the source code"
	@echo "\tpackage:		Packages the compiled code into a .vsix file"
	@echo "\tpublish-vsc:		[NOT WORKING] Publishes the extension to the official marketplace"
	@echo "\tpublish-vsx-source:	Publishes the extension to the OpenVSX marketplace"
	@echo "\tpublish-vsx-package:	Publishes the .vsix file to the OpenVSX marketplace"
	@echo "\tvsc-login:		Logs you into the official marketplace"
	@echo "\tcreate-namespace:	Creates a namespace on the OpenVSX marketplace"

decrypt: $(SECRETS_DECRYPT)
ifeq ("$(wildcard $(SECRETS_DECRYPT))","")
	$(eval include $(SECRETS_DECRYPT))
else
include $(SECRETS_DECRYPT)
endif

$(SECRETS_DECRYPT): $(SECRETS_FILE)
	@gpg -o $(SECRETS_DECRYPT) -d $(SECRETS_FILE)

publish: decrypt
	echo "$(VSC_TOKEN)" | $(VSCE) publish
	$(OVSX) publish -p $(VSX_TOKEN)

compile:
	$(NPM_RUN) vscode:prepublish

package:
	$(VSCE) package

publish-vsc: vsc-login
	$(VSCE) publish

publish-vsx-source: decrypt
	$(OVSX) publish -p $(VSX_TOKEN)

publish-vsx-package: decrypt
	$(OVSX) publish *.vsix -p $(VSX_TOKEN)

vsc-login: decrypt
	echo "$(VSC_TOKEN)" | $(VSCE) login $(NAMESPACE)

vsc-logout: decrypt
	$(VSCE) logout $(NAMESPACE)

create-namespace: decrypt
	$(OVSX) create-namespace $(NAMESPACE) -p $(VSX_TOKEN)

.PHONY: compile package publish-vsc publish-vsx-source publish-vsx-package vsc-login create-namespace decrypt
