# Welcome to chrysalis-transformation-api!

- Follow installation & running instructions below. 

# Installation
Setup environment variables:

-   Create a `.env` file by copying the contents of `.env.example`

Install postgres:

-   `docker run -d --name=postgres-database -p 5432:5432 -e POSTGRES_PASSWORD=kidsloop postgres`

Install redis:

-   `docker run -d --name=redis-database -p 6379:6379 redis:alpine`

Install dependencies:

-   `npm i`
-   `npx prisma db push`
-   `npm run prisma:generate`

# Running

Start postgres:

-  `docker start postgres-database`

Start redis:

-  `docker start redis-database`

Start the application:

- `npm start`
- or, `npm run start:dev` for nodemon monitoring

### Docker

You can also run the application with its dependencies through a docker-compose. For this just run:
- `docker-compose up`
