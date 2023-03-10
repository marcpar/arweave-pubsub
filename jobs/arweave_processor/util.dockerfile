FROM node:16.6.2 as build

WORKDIR /workdir/jobs/arweave_processor
COPY . /workdir

RUN apt-get update && apt-get -y install git
RUN npm install

ENTRYPOINT ["sh", "-c"]
CMD ["npm run callback-server"]
