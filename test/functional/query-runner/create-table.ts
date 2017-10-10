import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import {TableOptions} from "../../../src/schema-builder/options/TableOptions";

describe.only("query runner > create table", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create table from simple object", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const options: TableOptions = {
            name: "post",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "name",
                    type: "varchar",
                    isNullable: false
                }
            ]
        };
        await queryRunner.createTable(new Table(options));

        const table = await queryRunner.getTable("post");
        table!.should.exist;

        await queryRunner.release();
    })));

    it("should correctly create table from Table object", () => Promise.all(connections.map(async connection => {

       /* const queryRunner = connection.createQueryRunner();
        const idColumn = new TableColumn({
            name: "id",
            type: "int",
            isPrimary: true,
            isGenerated: true,
            generationStrategy: "increment"
        });
        const nameColumn = new TableColumn({
            name: "name",
            type: "varchar",
            isNullable: false
        });
        const post = new Table("post", [idColumn, nameColumn]);
        await queryRunner.createTable(post);

        const table = await queryRunner.getTable("post");
        table!.should.exist;

        await queryRunner.release();*/
    })));

});
