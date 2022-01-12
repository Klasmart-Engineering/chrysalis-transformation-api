# Welcome to chrysalis-transformation-api!

- Follow installation & running instructions below.

## Installation

Setup environment variables:

- Create a `.env` file by copying the contents of `.env.example`

Install postgres:

- `docker run -d --name=postgres-database -p 5432:5432 -e POSTGRES_PASSWORD=kidsloop postgres`

Install redis:

- `docker run -d --name=redis-database -p 6379:6379 redis:alpine`

Install dependencies:

- `npm i`
- `npx prisma db push`
- `npm run prisma:generate`

## New Relic

Set `NEW_RELIC_LICENSE_KEY` and `NEW_RELIC_APP_NAME` in your `.env` file. If you don't have the information, register at https://newrelic.com and create one.

## Running

Start postgres:

- `docker start postgres-database`

Start redis:

- `docker start redis-database`

Start the application:

- `npm start`
- or, `npm run start:dev` for nodemon monitoring

### Docker

You can also run the application with its dependencies through a docker-compose. For this just run:

- `docker-compose up`

### Migration

- `npm run migrate:dev`

### Connect to Admin Service (former User Service) on local machine

**Important:** you need to have access to the repo https://bitbucket.org/calmisland/kidsloop-user-service/, if you don't please contact @emfg on Slack.

Follow `kidsloop-user-service`'s README [`Installation`](https://bitbucket.org/calmisland/kidsloop-user-service/src/master/README.md#markdown-header-installation) & [`Running`](https://bitbucket.org/calmisland/kidsloop-user-service/src/master/README.md#markdown-header-running) sections to start the service.

Next, we need to create a user & organization, you can whether create on `Admin Service` GraphQL playground at http://localhost:8080/user/playground or simply run below SQL script:

> Please remember to input your Organization Admin `roleRoleId` (can be found in `role` table) in the last query.

```sql
INSERT INTO "public"."organization" ("organization_id", "organization_name", "address1", "address2", "phone", "shortCode", "status", "deleted_at", "primaryContactUserId", "created_at", "updated_at") VALUES
('001be878-11c2-40dc-ad25-bfbcbf6f0960', 'Chrysalis BLP Classic', NULL, NULL, NULL, 'DFXI9JM7UK', 'active', NULL, '514cd042-c24d-57ce-815c-9e50989f4031', '2021-11-17 00:34:21.935', '2021-11-17 00:34:21.935');

INSERT INTO "public"."organization_membership" ("user_id", "organization_id", "status", "join_timestamp", "shortcode", "deleted_at", "userUserId", "organizationOrganizationId", "created_at", "updated_at") VALUES
('514cd042-c24d-57ce-815c-9e50989f4031', '001be878-11c2-40dc-ad25-bfbcbf6f0960', 'active', '2021-05-18 14:53:44.462997', NULL, NULL, '514cd042-c24d-57ce-815c-9e50989f4031', '001be878-11c2-40dc-ad25-bfbcbf6f0960', '2021-11-17 00:34:21.935', '2021-11-17 00:34:21.935');

INSERT INTO "public"."organization_ownership" ("user_id", "organization_id", "status", "deleted_at", "created_at", "updated_at") VALUES
('514cd042-c24d-57ce-815c-9e50989f4031', '001be878-11c2-40dc-ad25-bfbcbf6f0960', 'active', NULL, '2021-11-17 00:34:21.935', '2021-11-17 00:34:21.935');

INSERT INTO "public"."user" ("user_id", "given_name", "family_name", "username", "email", "phone", "date_of_birth", "gender", "avatar", "status", "deleted_at", "primary", "alternate_email", "alternate_phone", "myOrganizationOrganizationId", "created_at", "updated_at") VALUES
('514cd042-c24d-57ce-815c-9e50989f4031', NULL, NULL, NULL, 'john@example.com', NULL, NULL, NULL, NULL, 'active', NULL, 'f', NULL, NULL, '001be878-11c2-40dc-ad25-bfbcbf6f0960', '2021-11-17 00:34:21.935', '2021-11-17 00:34:21.935');

INSERT INTO "public"."role_memberships_organization_membership" ("roleRoleId", "organizationMembershipUserId", "organizationMembershipOrganizationId") VALUES
('replace_organization_admin_uuid_here', '514cd042-c24d-57ce-815c-9e50989f4031', '001be878-11c2-40dc-ad25-bfbcbf6f0960');
```

Then you can use below JWT to connect to `Admin Service` by set it for `ADMIN_SERVICE_JWT` environment variable in `.env`.

> If you create a user & organization on GraphQL playground, you will need to generate the JWT yourself, instruction can be found at [Admin Service onboarding document](https://bitbucket.org/calmisland/kidsloop-user-service/src/master/documents/howto/onboarding.md#markdown-header-token-script)

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJjYWxtaWQtZGVidWciLCJpZCI6IjUxNGNkMDQyLWMyNGQtNTdjZS04MTVjLTllNTA5ODlmNDAzMSIsIm5hbWUiOm51bGwsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsImFkbWluIjp0cnVlfQ.-YX-mL05D-ucomyS2IXw9VYapF5vq6fvSzsJ6SFUtt4
```

## Onboarding a new school

To onboarding a new school along with its classes, users run this:

> Please remember to replace `X_API_SECRET` with your pre-defined one in `.env`

```
curl --location --request POST 'http://localhost:4200/onboarding' \
--header 'Content-Type: application/json' \
--header 'X_API_SECRET: abcxyz' \
--data-raw '{
    "organizationName": "Chrysalis BLP Classic",
    "schoolName": "Bharti Model School"
}'
```
