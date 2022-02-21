FROM node:16-alpine

WORKDIR /usr/app
COPY package.json tsconfig.json ./
COPY src ./src
COPY types ./types
COPY newrelic.js .

RUN npm install

EXPOSE 4200

CMD npm start
