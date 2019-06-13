# API DB

This is the database adapter that the frontend uses to display results. The results are stored whenever a benchmark is run.

There is an associated Postgres db which is the only type of database currently supported. In the future we could add more supported databases.

## Migrations

In order to run the migrations required for the database you can run the following command:

```
yarn migrate:postgres up
```
