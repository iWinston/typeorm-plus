#!/usr/bin/env node
import {SchemaSyncCommand} from "./commands/SchemaSyncCommand";
import {SchemaDropCommand} from "./commands/SchemaDropCommand";
import {QueryCommand} from "./commands/QueryCommand";
import {EntityGenerateCommand} from "./commands/EntityGenerateCommand";

require("yargonaut")
    .style("blue")
    .style("yellow", "required")
    .helpStyle("green")
    .errorsStyle("red");

require("yargs")
    .usage("Usage: $0 <command> [options]")
    .command(new SchemaSyncCommand())
    .command(new SchemaDropCommand())
    .command(new QueryCommand())
    .command(new EntityGenerateCommand())
    .demand(1)
    .version(() => require("./package.json").version)
    .alias("v", "version")
    .help("h")
    .alias("h", "help")
    .argv;