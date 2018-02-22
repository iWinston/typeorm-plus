import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {expect} from "chai";
import {PromiseUtils} from "../../../src";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";

describe("schema builder > change column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly change column name", () => PromiseUtils.runInSequence(connections, async connection => {
        const postMetadata = connection.getMetadata("post");
        const nameColumn = postMetadata.findColumnWithPropertyName("name")!;
        nameColumn.propertyName = "title";
        nameColumn.build(connection);

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        expect(postTable!.findColumnByName("name")).to.be.undefined;
        postTable!.findColumnByName("title")!.should.be.exist;

        await queryRunner.release();

        // revert changes
        nameColumn.propertyName = "name";
        nameColumn.build(connection);
    }));

    it("should correctly change other column properties", () => PromiseUtils.runInSequence(connections, async connection => {
        const postMetadata = connection.getMetadata("post");
        const idColumn = postMetadata.findColumnWithPropertyName("id")!;
        const nameColumn = postMetadata.findColumnWithPropertyName("name")!;
        const versionColumn = postMetadata.findColumnWithPropertyName("version")!;
        idColumn.isGenerated = true;
        idColumn.generationStrategy = "increment";
        nameColumn.length = "500";

        // SQLite does not support AUTOINCREMENT with composite primary keys
        if (!(connection.driver instanceof AbstractSqliteDriver))
            versionColumn.isPrimary = true;

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        postTable!.findColumnByName("id")!.isGenerated.should.be.true;
        postTable!.findColumnByName("id")!.generationStrategy!.should.be.equal("increment");
        postTable!.findColumnByName("name")!.length.should.be.equal("500");

        // SQLite does not support AUTOINCREMENT with composite primary keys
        if (!(connection.driver instanceof AbstractSqliteDriver))
            postTable!.findColumnByName("version")!.isPrimary.should.be.true;

        await queryRunner.release();

        // revert changes
        idColumn.isGenerated = false;
        idColumn.generationStrategy = undefined;
        nameColumn.length = "255";
        versionColumn.isPrimary = false;
    }));

});
