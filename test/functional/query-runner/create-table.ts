import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import {TableOptions} from "../../../src/schema-builder/options/TableOptions";
import {PostEntity} from "./entity/PostEntity";

describe("query runner > create table", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            dropSchema: true,
        });
    });
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

    it("should correctly create table from Entity", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const metadata = connection.getMetadata(PostEntity);
        const newTable = Table.create(metadata, connection.driver);
        await queryRunner.createTable(newTable);

        const table = await queryRunner.getTable("post_entity");
        table!.should.exist;

        await queryRunner.release();
    })));

});
