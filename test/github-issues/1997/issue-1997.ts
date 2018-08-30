import "reflect-metadata";
import {createTestingConnections, closeTestingConnections} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";

describe("github issues > #1997 enum type not working in postgres", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["postgres"],
    }));
    beforeEach(() => {
        return Promise.all(connections.map(async connection => {
            const queryRunner = connection.createQueryRunner();
            await queryRunner.dropSchema("schema", true, true);
            await queryRunner.createSchema("schema");
            await queryRunner.release();
        }));
    });
    afterEach(() => {
        return Promise.all(connections.map(async connection => {
            const queryRunner = connection.createQueryRunner();
            await queryRunner.dropSchema("schema", true, true);
            await queryRunner.release();
        }));
    });
    after(() => closeTestingConnections(connections));

    it("should be able to create table with enum in non default schema", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();
    })));

    it("should be able to read table data with enum in non default schema", () => Promise.all(connections.map(async connection => {
        await connection.driver.createSchemaBuilder().build();
        const queryRunner = connection.createQueryRunner();
        await queryRunner.getTable("schema.user");
        await queryRunner.release();
    })));
});