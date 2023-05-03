FROM node:16.6.2 as build

WORKDIR /workdir/jobs/vault_processor
COPY . /workdir

# Build Lib
RUN cd /workdir/lib && \
    npm install && \
    npm run build

RUN apt-get update && apt-get -y install git
RUN yarn install

ENTRYPOINT [ "sh", "-c" ]
CMD ["yarn callback-server"]
