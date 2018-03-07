import "reflect-metadata";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {PromiseUtils} from "../../../src";
import {Teacher} from "./entity/Teacher";
import {Student} from "./entity/Student";
import {UniqueMetadata} from "../../../src/metadata/UniqueMetadata";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";
import {Post} from "./entity/Post";

describe("schema builder > change unique constraint", () => {

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
        const teacherTable = await queryRunner.getTable("teacher");
        await queryRunner.release();

        if (connection.driver instanceof MysqlDriver) {
            teacherTable!.indices.length.should.be.equal(1);
            teacherTable!.indices[0].isUnique!.should.be.true;

        } else {
            teacherTable!.uniques.length.should.be.equal(1);
        }

        // revert changes
        teacherMetadata.uniques.splice(teacherMetadata.uniques.indexOf(uniqueMetadata), 1);
    }));

    it.only("should correctly change unique constraint", () => PromiseUtils.runInSequence(connections, async connection => {
        const postMetadata = connection.getMetadata(Post);
        const uniqueMetadata = postMetadata.uniques.find(uq => uq.columns.length === 2);
        uniqueMetadata!.name = "changed_unique";

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const postTable = await queryRunner.getTable("post");
        await queryRunner.release();

        if (connection.driver instanceof MysqlDriver) {
            console.log(postTable!.indices);
            const tableUnique = postTable!.indices.find(index => index.columnNames.length === 2 && index.isUnique === true);
            tableUnique!.name!.should.be.equal("changed_unique");

        } else {
            const tableUnique = postTable!.uniques.find(unique => unique.columnNames.length === 2);
            tableUnique!.name!.should.be.equal("changed_unique");
        }

        // revert changes
        uniqueMetadata!.name = connection.namingStrategy.uniqueConstraintName(postTable!, uniqueMetadata!.columns.map(c => c.databaseName));
    }));

    it("should correctly drop removed unique constraint", () => PromiseUtils.runInSequence(connections, async connection => {
        const studentMetadata = connection.getMetadata(Student);
        studentMetadata.indices = [];

        await connection.synchronize();

        const queryRunner = connection.createQueryRunner();
        const studentTable = await queryRunner.getTable("student");
        await queryRunner.release();

        studentTable!.indices.length.should.be.equal(0);
    }));

});
