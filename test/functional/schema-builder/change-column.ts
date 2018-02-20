import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {expect} from "chai";
import {PromiseUtils} from "../../../src";

describe("schema builder > change column", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
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

    it("should correctly change column length", () => PromiseUtils.runInSequence(connections, async connection => {
        const postMetadata = connection.getMetadata("post");
        const nameColumn = postMetadata.findColumnWithPropertyName("name")!;
        const versionColumn = postMetadata.findColumnWithPropertyName("version")!;
        nameColumn.length = "500";
        versionColumn.isPrimary = true;

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        postTable!.findColumnByName("name")!.length.should.be.equal("500");
        postTable!.findColumnByName("version")!.isPrimary.should.be.true;

        await queryRunner.release();

        // revert changes
        nameColumn.length = "255";
        versionColumn.isPrimary = false;
    }));

});
