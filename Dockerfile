FROM node:4.4.3-slim

RUN npm install npm@3 -g && npm install && npm run build-server

WORKDIR /src
COPY . /src

CMD npm run production

EXPOSE 80
