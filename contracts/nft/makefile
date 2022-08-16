
accountID := `cat neardev/dev-account`

build-contract:
	@echo building contract nft
	cargo build --release --target wasm32-unknown-unknown

build: build-contract

contract-dev-deploy: build-contract
	rm -rf out
	mkdir -p out
	cp target/wasm32-unknown-unknown/release/nft.wasm out/main.wasm
	near dev-deploy

test-mint:
	near call $(accountID) mint '{"id": "1", "media_id": "XIi9Di1EdbFOiLobI-yVaLwWIUha8G66p38THJxPl6o", "metadata_id": "XIi9Di1EdbFOiLobI-yVaLwWIUha8G66p38THJxPl6o/metadata.json", "owner_id": "marcpar10.testnet", "title": "testmint", "metadata": "{}"}' --accountId $(accountID) --amount 0.007

init:
	near call $(accountID) default --accountId $(accountID)

get-token:
	near view $(accountID) nft_token '{""}'