
accountID := `cat neardev/dev-account`

build-contract:
	@echo building contract vault
	cargo build --release --target wasm32-unknown-unknown

build: build-contract

contract-dev-deploy: build-contract
	rm -rf out
	mkdir -p out
	cp target/wasm32-unknown-unknown/release/vault.wasm out/main.wasm
	near dev-deploy

init:
	near call $(accountID) default --accountId $(accountID)