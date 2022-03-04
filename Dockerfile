FROM node:16-alpine

WORKDIR /usr/app
ARG NPM_TOKEN
COPY package.json tsconfig.json ./
COPY src ./src
COPY types ./types
COPY newrelic.js .
COPY .npmrc .

RUN npm install

EXPOSE 4200

CMD npm start
