FROM node:16.6.2 as build

WORKDIR /workdir
COPY . /workdir

RUN apt-get update && apt-get -y install git
RUN yarn install

ENTRYPOINT [ "sh", "-c" ]
CMD ["yarn callback-server"]
