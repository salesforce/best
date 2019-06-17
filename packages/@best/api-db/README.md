# API DB

This is the database adapter that the frontend uses to display results. The results are stored whenever a benchmark is run.

Below you can find instructions for using either Postgres or SQLite.

## Postgres

### Config
Inside your `best.config.js` you need to have the following:
```
{
    apiDatabase: {
        adapter: 'sql/postgres',
        host: '',
        user: '',
        password: ''
    }
}
```

For Postgres, you need to provision and manage your own database.

### Migrations
In order to run the migrations required for the database you can run the following command:

```
yarn migrate:postgres up
```

## SQLite

### Config
Inside your `best.config.js` you need to have the following:
```
{
    apiDatabase: {
        adapter: 'sql/sqlite',
        path: 'PATH_TO_SQLITE_DB'
    }
}
```

You do not need to create your own sqlite file, the adapter will handle that for you.