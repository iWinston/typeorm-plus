import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {PromiseUtils} from "../../../src";
import {Teacher} from "./entity/Teacher";
import {UniqueMetadata} from "../../../src/metadata/UniqueMetadata";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";
import {Post} from "./entity/Post";
import {AbstractSqliteDriver} from "../../../src/driver/sqlite-abstract/AbstractSqliteDriver";

describe("schema builder > change unique constraint", () => {

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

    it("should correctly add new unique constraint", () => PromiseUtils.runInSequence(connections, async connection => {
        const teacherMetadata = connection.getMetadata(Teacher);
        const nameColumn = teacherMetadata.findColumnWithPropertyName("name")!;
        const uniqueMetadata = new UniqueMetadata({
            entityMetadata: teacherMetadata,
            columns: [nameColumn],
            args: {
                target: Teacher
            }
        });
        uniqueMetadata.build(connection.namingStrategy);
        teacherMetadata.uniques.push(uniqueMetadata);

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("teacher");
        await queryRunner.release();

        if (connection.driver instanceof MysqlDriver) {
            table!.indices.length.should.be.equal(1);
            table!.indices[0].isUnique!.should.be.true;

        } else {
            table!.uniques.length.should.be.equal(1);
        }

        // revert changes
        teacherMetadata.uniques.splice(teacherMetadata.uniques.indexOf(uniqueMetadata), 1);
    }));

    it("should correctly change unique constraint", () => PromiseUtils.runInSequence(connections, async connection => {
        // Sqlite does not store unique constraint name
        if (connection.driver instanceof AbstractSqliteDriver)
            return;

        const postMetadata = connection.getMetadata(Post);
        const uniqueMetadata = postMetadata.uniques.find(uq => uq.columns.length === 2);
        uniqueMetadata!.name = "changed_unique";

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        if (connection.driver instanceof MysqlDriver) {
            const tableIndex = table!.indices.find(index => index.columnNames.length === 2 && index.isUnique === true);
            tableIndex!.name!.should.be.equal("changed_unique");

        } else {
            const tableUnique = table!.uniques.find(unique => unique.columnNames.length === 2);
            tableUnique!.name!.should.be.equal("changed_unique");
        }

        // revert changes
        uniqueMetadata!.name = connection.namingStrategy.uniqueConstraintName(table!, uniqueMetadata!.columns.map(c => c.databaseName));
    }));

    it("should correctly drop removed unique constraint", () => PromiseUtils.runInSequence(connections, async connection => {
        const postMetadata = connection.getMetadata(Post);
        postMetadata!.uniques = [];

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const table = await queryRunner.getTable("post");
        await queryRunner.release();

        if (connection.driver instanceof MysqlDriver) {
            table!.indices.length.should.be.equal(1);

        } else {
            table!.uniques.length.should.be.equal(1);
        }
    }));

});
