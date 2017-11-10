import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe("query runner > drop column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "mysql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly drop column and revert drop", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        const idColumn = table!.findColumnByName("id")!;
        const nameColumn = table!.findColumnByName("name")!;
        idColumn!.should.be.exist;
        nameColumn!.should.be.exist;

        await queryRunner.dropColumn(table!, idColumn);
        await queryRunner.dropColumn(table!, nameColumn);

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("id")).to.be.undefined;
        expect(table!.findColumnByName("name")).to.be.undefined;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.should.be.exist;
        table!.findColumnByName("name")!.should.be.exist;

        await queryRunner.release();
    })));

});
