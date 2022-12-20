# Near NFT Processor

Near NFT Minter using Arweave and Near Protocol

## Architecture
![](./docs/assets/nft-minter-infra.png)

## Jobs

- [Arweave Processor](./jobs/arweave_processor/README.md) - Service responsible for uploading media to the permaweb. Check [arweave processor local demo](./docs/assets/arweave_processor/DEMO.md) for instructions on how to simulate the service on local machine.
- [Near Processor](./jobs/near_processor/README.md) - Service responsible for minting the nfts and sending them to their respective owners.

## Contracts
- [NFT Contract](./contracts/nft/README.md)

## Production
### Requirements
- [docker/docker-compose](https://docs.docker.com/get-docker/)

### Configuration
Before running, a dotenv file is required to configure each service.
Kindly check the documentation for available keys to configure.

- [arweave_processor.env](./jobs/arweave_processor/README.md#environment-configuration)
- [near_processor.env](./jobs/near_processor/README.md#environment-configuration)

### Build the images

Build the production images with docker-compose
```bash
    docker-compose -f docker-compose-production.yaml build 
```

### Run
Once arweave_processor.env and near_processor.env is configured on the working directory, run the service using docker-compose.
```bash
    docker-compose -f docker-compose-production.yaml up -d
    # OR run each service with additional replica
    docker-compose -f docker-compose-production.yaml up -d --scale arweave_processor=<REPLICA_COUNT> --scale near_processor=<REPLICA_COUNT>
```

 
