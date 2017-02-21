FROM node:4.7.3-alpine

RUN apk update && \
    apk upgrade && \
    apk add tini

RUN npm install npm@3 -g

WORKDIR /src

ENTRYPOINT ["/sbin/tini", "-g", "--"]

EXPOSE 80
