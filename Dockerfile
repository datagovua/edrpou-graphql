FROM node:4.7.3-alpine

COPY . /src
WORKDIR /src

RUN npm install npm@3 -g && npm install && npm run build-server

CMD npm run production

EXPOSE 80
