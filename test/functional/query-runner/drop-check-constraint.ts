import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe.skip("query runner > drop check constraint", () => {

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

    it("should correctly drop check constraint and revert drop", () => Promise.all(connections.map(async connection => {

        // Mysql does not support check constraint.
        if (connection.driver instanceof MysqlDriver)
            return;

        const queryRunner = connection.createQueryRunner();

        let table = await queryRunner.getTable("post");
        table!.uniques.length.should.be.equal(2);

        // find composite unique constraint to delete
        const unique = table!.uniques.find(u => u.columnNames.length === 2);
        await queryRunner.dropUniqueConstraint(table!, unique!);

        table = await queryRunner.getTable("post");
        table!.uniques.length.should.be.equal(1);

        await queryRunner.executeMemoryDownSql();

        table = await queryRunner.getTable("post");
        table!.uniques.length.should.be.equal(2);

        await queryRunner.release();
    })));

});
