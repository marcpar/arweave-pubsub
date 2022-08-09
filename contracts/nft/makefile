
build-contract:
	@echo building contract nft
	cargo build --release --target wasm32-unknown-unknown

build: build-contract

contract-dev-deploy: build-contract
	rm -rf out
	mkdir -p out
	cp target/wasm32-unknown-unknown/release/nft.wasm out/main.wasm
	near dev-deploy