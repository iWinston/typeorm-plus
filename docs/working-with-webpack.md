# Webpack for the backend

Webpack produces warnings due to what it views are missing require statements -- require statements for all drivers supported by TypeORM. To suppress these warnings for unused drivers, you will need to edit your webpack config file.

```js
const FilterWarningsPlugin = require('webpack-filter-warnings-plugin');

module.exports = {
    ...
    plugins: [
        //ignore the drivers you don't want. This is the complete list of all drivers -- remove the suppressions for drivers you want to use.
        new FilterWarningsPlugin({
            exclude: [/mongodb/, /mssql/, /mysql/, /mysql2/, /oracledb/, /pg/, /pg-native/, /pg-query-stream/, /redis/, /sqlite3/]
        })
    ]
};
```
