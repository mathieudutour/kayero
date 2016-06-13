BIN_DIR ?= node_modules/.bin

SRC_DIR ?= src
BUILD_DIST ?= dist
BUILD_TARGET ?= .
RELEASE_DIST ?= release
BUILD_FLAGS ?= --all --overwrite --prune --out=$(RELEASE_DIST) --extend-info=electron/kayero.plist

TEST_TARGET ?= tests/
TEST_FLAGS ?= --require babel-register

P="\\033[34m[+]\\033[0m"

#
# CLEAN
#

clean:
	echo "  $(P) Cleaning"
	rm -rf build/

#
# BUILD
#

build: clean
	echo "  $(P) Building"
	$(BIN_DIR)/webpack --config prod.webpack.config.js -p --progress --colors
	$(BIN_DIR)/electron-packager $(RELEASE_DIST) $(BUILD_FLAGS)

build-watch: clean
	echo "  $(P) Building forever"
	node server.js

#
# TEST
#

lint:
	echo "  $(P) Linting"
	$(BIN_DIR)/eslint $(SRC_DIR) && $(BIN_DIR)/eslint $(TEST_TARGET)

test: lint
	echo "  $(P) Testing"
	NODE_ENV=test $(BIN_DIR)/ava $(TEST_TARGET) $(TEST_FLAGS)

test-watch:
	echo "  $(P) Testing forever"
	NODE_ENV=test $(BIN_DIR)/ava --watch $(TEST_TARGET) $(TEST_FLAGS)

#
# MAKEFILE
#

.PHONY: \
	clean \
	build build-watch \
	lint test test-watch

.SILENT:
