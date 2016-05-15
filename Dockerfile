FROM node:4.4.3-slim

COPY . /src
WORKDIR /src

RUN npm install npm@3 -g && npm install && npm run build-server

CMD npm run production

EXPOSE 80
