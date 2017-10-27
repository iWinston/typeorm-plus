import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";

describe.only("query runner > change column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly change column and revert change", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.length!.should.be.equal("255");

        const textColumn = table!.findColumnByName("text")!;
        const changedTextColumn = textColumn.clone();
        changedTextColumn.isPrimary = true;
        changedTextColumn.length = "500";
        changedTextColumn.default = "'default text'";
        await queryRunner.changeColumn(table!, textColumn, changedTextColumn);

        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.isPrimary.should.be.true;
        table!.findColumnByName("text")!.length!.should.be.equal("500");
        table!.findColumnByName("text")!.default!.should.exist;

        const idColumn = table!.findColumnByName("id")!;
        const changedIdColumn = idColumn.clone();
        changedIdColumn!.isUnique = false;

        await queryRunner.changeColumn(table!, idColumn, changedIdColumn);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.isUnique.should.be.false;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.isPrimary.should.be.false;
        table!.findColumnByName("text")!.length!.should.be.equal("255");
        expect(table!.findColumnByName("text")!.default).to.be.undefined;
        table!.findColumnByName("id")!.isUnique.should.be.true;
        table!.findColumnByName("text")!.length!.should.be.equal("255");

        changedIdColumn.isGenerated = true;
        changedIdColumn.generationStrategy = "increment";
        await queryRunner.changeColumn(table!, idColumn, changedIdColumn).should.be.rejected;

        await queryRunner.release();
    })));

});
