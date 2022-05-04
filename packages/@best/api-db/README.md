# API DB

This is the database adapter that the frontend uses to display results. The results are stored whenever a benchmark is run.

Below you can find instructions for using either Postgres or SQLite. By default Best uses a local SQLite file, however we recommend using Postgres if you are running on anything other than your local machine.

## SQLite

SQLite is configured by default, but if you would like to provide a custom path you can use the following configuration.

### Config

Inside your `best.config.js` you need to have the following:

```
{
    apiDatabase: {
        adapter: 'sql/sqlite',
        uri: 'PATH_TO_SQLITE_DB'
    }
}
```

You do not need to create your own sqlite file, the adapter will handle that for you.

## Postgres

### Config

Inside your `best.config.js` you need to have the following:

```
{
    apiDatabase: {
        adapter: 'sql/postgres',
        uri: 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb
    }
}
```

For Postgres, you need to provision and manage your own database.
