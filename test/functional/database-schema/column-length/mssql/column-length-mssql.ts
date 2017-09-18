import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";

describe("database schema > column length > mssql", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [Post],
            enabledDrivers: ["mssql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("all types should create with correct size", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.getTable("post");
        await queryRunner.release();

        expect(tableSchema!.findColumnByName("char")!.length).to.be.equal(50);
        expect(tableSchema!.findColumnByName("varchar")!.length).to.be.equal(50);
        expect(tableSchema!.findColumnByName("nchar")!.length).to.be.equal(50);
        expect(tableSchema!.findColumnByName("nvarchar")!.length).to.be.equal(50);
        expect(tableSchema!.findColumnByName("binary")!.length).to.be.equal(50);
        expect(tableSchema!.findColumnByName("varbinary")!.length).to.be.equal(50);
    
    })));

    it("all types should update their size", () => Promise.all(connections.map(async connection => {
        
        let metadata = connection.getMetadata(Post);
        metadata.findColumnWithPropertyName("char")!.length = 100;
        metadata.findColumnWithPropertyName("varchar")!.length = 100;
        metadata.findColumnWithPropertyName("nchar")!.length = 100;
        metadata.findColumnWithPropertyName("nvarchar")!.length = 100;
        metadata.findColumnWithPropertyName("binary")!.length = 100;
        metadata.findColumnWithPropertyName("varbinary")!.length = 100;

        await connection.synchronize(false);        

        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.getTable("post");
        await queryRunner.release();

        expect(tableSchema!.findColumnByName("char")!.length).to.be.equal(100);
        expect(tableSchema!.findColumnByName("varchar")!.length).to.be.equal(100);
        expect(tableSchema!.findColumnByName("nchar")!.length).to.be.equal(100);
        expect(tableSchema!.findColumnByName("nvarchar")!.length).to.be.equal(100);
        expect(tableSchema!.findColumnByName("binary")!.length).to.be.equal(100);
        expect(tableSchema!.findColumnByName("varbinary")!.length).to.be.equal(100);
            
    })));

    it("all relevant types should update their size to max", () => Promise.all(connections.map(async connection => {
        
        let metadata = connection.getMetadata(Post);
        metadata.findColumnWithPropertyName("varchar")!.length = "MAX";
        metadata.findColumnWithPropertyName("nvarchar")!.length = "MAX";
        metadata.findColumnWithPropertyName("varbinary")!.length = "MAX";

        await connection.synchronize(false);        

        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.getTable("post");
        await queryRunner.release();

        expect(tableSchema!.findColumnByName("varchar")!.length).to.be.equal(-1);
        expect(tableSchema!.findColumnByName("nvarchar")!.length).to.be.equal(-1);
        expect(tableSchema!.findColumnByName("varbinary")!.length).to.be.equal(-1);
            
    })));
    
});
