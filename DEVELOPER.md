# Building and Testing TypeORM

This document describes how to set up your development environment and run TypeORM test cases.

* [Prerequisite Software](#prerequisite-software)
* [Getting the Sources](#getting-the-sources)
* [Installing NPM Modules](#installing-npm-modules)
* [Building](#building)
* [Running Tests Locally](#running-tests-locally)

See the [contribution guidelines](https://github.com/angular/angular/blob/master/CONTRIBUTING.md)
if you'd like to contribute to Angular.

## Prerequisite Software

Before you can build and test TypeORM, you must install and configure the
following products on your development machine:

* [Git](http://git-scm.com) and/or the **GitHub app** (for [Mac](http://mac.github.com) or
  [Windows](http://windows.github.com)); [GitHub's Guide to Installing
  Git](https://help.github.com/articles/set-up-git) is a good source of information.

* [Node.js](http://nodejs.org), (better to install latest version) which is used to run a development web server,
  run tests, and generate distributable files. 
  Depending on your system, you can install Node either from source or as a pre-packaged bundle.
* [Mysql](https://www.mysql.com/) is required to run tests on this platform
* [MariaDB](https://mariadb.com/) is required to run tests on this platform
* [Postgres](https://www.postgresql.org/) is required to run tests on this platform
* [Oracle](https://www.oracle.com/database/index.html) is required to run tests on this platform
* [Microsoft SQL Server](https://www.microsoft.com/en-us/cloud-platform/sql-server) is required to run tests on this platform

## Getting the Sources

Fork and clone the repository:

1. Login to your GitHub account or create one by following the instructions given [here](https://github.com/signup/free).
2. [Fork](http://help.github.com/forking) the [main TypeORM repository](https://github.com/typeorm/typeorm).
3. Clone your fork of the TypeORM repository and define an `upstream` remote pointing back to
   the TypeORM repository that you forked in the first place.

```shell
# Clone your GitHub repository:
git clone git@github.com:<github username>/typeorm.git

# Go to the TypeORM directory:
cd typeorm

# Add the main TyepORM repository as an upstream remote to your repository:
git remote add upstream https://github.com/typeorm/typeorm.git
```
## Installing NPM Modules

Install all TypeORM dependencies by running this command:

```shell
npm install
```

During installation you may have some probelems with some dependencies. 
For example to proper install oracle driver you need to follow all instructions from
 [node-oracle documentation](https://github.com/oracle/node-oracledb).

Also install these packages globally:

* `npm install -g gulp` (you might need to prefix this command with `sudo`)
* `npm install -g typescript` (you might need to prefix this command with `sudo`)

## Building

To build a distribution package of TypeORM run:

```shell
gulp package
```

This command will generate you a distribution package in the `build/package` directory.
You can link (or simply copy/paste) this directory into your project and test TypeORM there
(but make sure to keep all node_modules required by TypeORM).

## Running Tests Locally

Setup your environment configuration by copying `ormconfig.json.dist` into `ormconfig.json` and 
replacing parameters with your own.

Then run tests:

```shell
gulp tests
```

You should execute test suites before submitting a PR to github.
All the tests are executed on our Continuous Integration infrastructure and a PR could only be merged once the tests pass.



