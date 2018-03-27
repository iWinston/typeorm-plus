import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Post} from "./entity/Post";

describe.skip("github issues > #1427 precision and scale column types with errant behavior", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly create column with precision and scale", () => Promise.all(connections.map(async connection => {
        const queryRunner = connection.createQueryRunner();
        // let table = await queryRunner.getTable("post");

        // table!.findColumnByName("qty")!.type.should.be.equal("decimal");
        // table!.findColumnByName("qty")!.scale!.should.be.equal(6);

        const metadata = connection.getMetadata(Post);
        const column = metadata.findColumnWithPropertyName("qty");
        // column!.scale = undefined;
        column!.isNullable = true;

        await connection.synchronize();

        await queryRunner.release();
    })));

});
