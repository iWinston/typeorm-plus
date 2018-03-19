import "reflect-metadata";
import {Connection} from "../../../../src";
import {closeTestingConnections, createTestingConnections} from "../../../utils/test-utils";
import {expect} from "chai";

describe("indices > indices with WHERE", () => {

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

    it("should correctly create indices with WHERE condition", () => Promise.all(connections.map(async connection => {
        // await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        let table = await queryRunner.getTable("post");

        table!.indices.length.should.be.equal(2);
        expect(table!.indices[0].where).to.be.not.empty;
        expect(table!.indices[1].where).to.be.not.empty;

    })));

});
