import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {TableColumn} from "../../../../src/schema-builder/table/TableColumn";

describe.only("database schema > migrations", () => {

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

    it("should correctly drop table and revert drop", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        table!.should.exist;

        await queryRunner.dropTable("post");

        table = await queryRunner.getTable("post");
        expect(table).to.be.undefined;

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.should.exist;

        await queryRunner.release();
    })));

    it("should correctly remove column and revert remove", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        const textColumn = table!.findColumnByName("id")!;
        textColumn!.should.be.exist;

        await queryRunner.dropColumn(table!, textColumn);

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("id")).to.be.undefined;

        console.log(queryRunner.getMemorySql());
        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.should.be.exist;

        await queryRunner.release();
    })));

    it.only("should correctly add column and revert add", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        const newColumn = new TableColumn({
            name: "secondId",
            type: "int",
            isPrimary: true,
            isUnique: true,
        });

        await queryRunner.addColumn(table!, newColumn);

        table = await queryRunner.getTable("post");
        table!.findColumnByName("secondId")!.should.be.exist;

        console.log(queryRunner.getMemorySql());
        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("secondId")).to.be.undefined;

        await queryRunner.release();
    })));

    it("should correctly change column and revert changes", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.length!.should.be.equal("255");

        const textColumn = table!.findColumnByName("text")!;
        const changedTextColumn = textColumn.clone();
        changedTextColumn.isPrimary = true;
        changedTextColumn.length = "500";
        changedTextColumn.default = "default text";
        await queryRunner.changeColumn(table!, textColumn, changedTextColumn);

        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.isPrimary.should.be.true;
        table!.findColumnByName("text")!.length!.should.be.equal("500");
        table!.findColumnByName("text")!.default!.should.exist;

        const idColumn = table!.findColumnByName("id")!;
        const changedIdColumn = idColumn.clone();
        changedIdColumn!.isUnique = true;

        await queryRunner.changeColumn(table!, idColumn, changedIdColumn);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.isUnique.should.be.true;

        console.log(queryRunner.getMemorySql());
        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.isPrimary.should.be.false;
        table!.findColumnByName("text")!.length!.should.be.equal("255");
        expect(table!.findColumnByName("text")!.default).to.be.undefined;
        table!.findColumnByName("id")!.isUnique.should.be.false;
        table!.findColumnByName("text")!.length!.should.be.equal("255");

        changedIdColumn.isGenerated = true;
        changedIdColumn.generationStrategy = "increment";
        await queryRunner.changeColumn(table!, idColumn, changedIdColumn).should.be.rejected;

        await queryRunner.release();
    })));

});
