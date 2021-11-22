FROM node:16-alpine

WORKDIR /usr/app
COPY package.json tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

RUN npm install

EXPOSE 4200

CMD npx prisma db push ; npm run prisma:generate ; npm start
