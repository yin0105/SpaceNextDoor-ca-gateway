FROM node:14.17 as builder
LABEL maintainer="Harry Nguyen"

WORKDIR /var/source

COPY ./package*.json ./
RUN npm install

COPY . .

FROM node:14.17-alpine
USER node

WORKDIR /var/source
COPY --from=builder --chown=node:node /var/source ./

ENTRYPOINT ["node", "server.js"]
