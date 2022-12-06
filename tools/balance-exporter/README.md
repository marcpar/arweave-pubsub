# Near Balance Exporter

Prometheus exporter that exposes target near accounts' balance.

## Build with docker

```bash
    docker build -t balance-exporter .
```

## Options
```
    Options:
        --help     Show help                                                 [boolean]
        --version  Show version number                                       [boolean]
        --account                                                   [array] [required]
        --network                                        [string] [default: "mainnet"]
        --port                                                [number] [default: 8080]
```

## Run and Expose Mainnet Balance

```bash
    docker run --rm -p 8080:8080 balance-exporter --account triathlon.near --account nft.triathlon.near --account vault.triathlon.near
```

