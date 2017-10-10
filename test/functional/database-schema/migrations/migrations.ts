import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
    runDownQueries,
    runUpQueries
} from "../../../utils/test-utils";
import {Post} from "./entity/Post";

describe("database schema > migrations", () => {

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
        const entityManager = queryRunner.manager;

        let table = await queryRunner.getTable("post");
        table!.should.exist;

        queryRunner.enableSqlMemory();
        await queryRunner.dropTable("post");
        const queries = queryRunner.getMemorySql();
        queryRunner.disableSqlMemory();

        await runUpQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        expect(table).to.be.undefined;

        await runDownQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        table!.should.exist;

        await queryRunner.release();
    })));

    it("should correctly remove column and revert remove", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const entityManager = queryRunner.manager;

        let table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.should.be.exist;

        const metadata = connection.getMetadata(Post);
        const columnMetadata = metadata.ownColumns.find(c => c.propertyName === "text")!;
        metadata.removeColumn(columnMetadata);
        const queries = await connection.driver.createSchemaBuilder().log();

        await runUpQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        expect(table!.findColumnByName("text")).to.be.undefined;

        await runDownQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.should.be.exist;

        metadata.registerColumn(columnMetadata);
        await queryRunner.release();
    })));

    it("should correctly change column and revert changes", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const entityManager = queryRunner.manager;

        const metadata = connection.getMetadata(Post);
        let table = await queryRunner.getTable("post");
        console.log(table!.findColumnByName("text"));
        table!.findColumnByName("text")!.length!.should.be.equal("255");

        // const column = metadata.ownColumns.find(c => c.propertyName === "text");
       /* column!.length = "500";
        let queries = await connection.driver.createSchemaBuilder().log();
        await runUpQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.length!.should.be.equal("500");

        await runDownQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("text")!.length!.should.be.equal("255");

        column!.length = "255";*/
        const idColumn = metadata.ownColumns.find(c => c.propertyName === "id");
        idColumn!.isGenerated = true;
        idColumn!.generationStrategy = "increment";
        const queries = await connection.driver.createSchemaBuilder().log();
        await runUpQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.isGenerated.should.be.true;
        table!.findColumnByName("id")!.generationStrategy!.should.be.equal("increment");

        await runDownQueries(entityManager, queries);
        table = await queryRunner.getTable("post");
        table!.findColumnByName("id")!.isGenerated.should.be.false;
        expect(table!.findColumnByName("id")!.generationStrategy).to.be.undefined;

        await queryRunner.release();
    })));

});
