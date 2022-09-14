FROM node:16.16.0 as builder

WORKDIR /workdir
COPY . /workdir

ENV REACT_APP_NEAR_NETWORK=testnet
ENV REACT_APP_VAULT_CONTRACT=vault.nftdw-001.testnet

RUN npm install && \
    npm run build

FROM node:16.16.0-alpine3.16

ENV NODE_ENV=production

WORKDIR /home/app
COPY --from=builder /workdir/build /home/app

RUN npm install -g serve

ENTRYPOINT ["sh", "-c"]
CMD ["npx serve -s /home/app -l 3000"]


