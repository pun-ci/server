.PHONY: watch_test test lint lint_fix verify

default: dist

dist: node_modules src
	node_modules/.bin/tsc -p ./src --pretty

watch_test: node_modules
	node_modules/.bin/jest --watch

test: node_modules
	node_modules/.bin/jest --verbose

lint: node_modules
	node_modules/.bin/eslint .

lint_fix: node_modules
	node_modules/.bin/eslint . --fix

verify: lint test

node_modules:
	yarn
	touch node_modules
