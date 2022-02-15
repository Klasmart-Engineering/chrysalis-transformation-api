# Welcome to the C1 integration layer!

- Follow installation & running instructions below.

## Installation

Setup environment variables:

- Create a `.env` file by copying the contents of `.env.example`

Install dependencies:

- `npm i`

## New Relic

Set `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_NAME` in your `.env` file. If you don't have the information, register at https://newrelic.com and create one.

## Running

Start the application:

- `npm start`
- or, `npm run start:dev` for nodemon monitoring

### Docker

You can also run the application with its dependencies through a docker-compose. For this just run:

- `docker-compose up`

## Generic Backend

For the Generic Backend setup please follow [these instructions](https://github.com/KL-Engineering/client-integration-layer-backend/blob/main/README.md)