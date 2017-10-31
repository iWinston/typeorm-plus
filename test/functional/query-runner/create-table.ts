import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections} from "../../utils/test-utils";
import {Table} from "../../../src/schema-builder/table/Table";
import {TableOptions} from "../../../src/schema-builder/options/TableOptions";
import {Post} from "./entity/Post";

describe("query runner > create table", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should correctly create table from simple object and revert creation", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const options: TableOptions = {
            name: "category",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "name",
                    type: "varchar",
                    isUnique: true,
                    isNullable: false
                }
            ]
        };
        await queryRunner.createTable(new Table(options));

        let table = await queryRunner.getTable("category");
        const idColumn = table!.findColumnByName("id");
        const nameColumn = table!.findColumnByName("name");
        idColumn!.should.be.exist;
        idColumn!.isPrimary.should.be.true;
        idColumn!.isGenerated.should.be.true;
        idColumn!.generationStrategy!.should.be.equal("increment");
        nameColumn!.should.be.exist;
        nameColumn!.isUnique.should.be.true;
        table!.should.exist;
        table!.uniques.length.should.be.equal(1);

        await queryRunner.executeMemoryDownSql();
        table = await queryRunner.getTable("category");
        expect(table).to.be.undefined;

        await queryRunner.release();
    })));

    it("should correctly create table from Entity", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const metadata = connection.getMetadata(Post);
        const newTable = Table.create(metadata, connection.driver);
        await queryRunner.createTable(newTable);

        const table = await queryRunner.getTable("post");
        table!.should.exist;

        await queryRunner.release();
    })));

    it("should correctly create table with all dependencies and revert creation", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        await queryRunner.createTable(new Table({
            name: "category",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "name",
                    type: "varchar",
                    default: "'default category'",
                    isUnique: true,
                    isNullable: false
                },
                {
                    name: "alternativeName",
                    type: "varchar",
                },
                {
                    name: "questionId",
                    type: "int",
                    isUnique: true
                }
            ],
            uniques: [{ columnNames: ["name", "alternativeName"] }],
            indices: [{ columnNames: ["questionId"] }]
        }));

        await queryRunner.createTable(new Table({
            name: "question",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true,
                    isGenerated: true,
                    generationStrategy: "increment"
                },
                {
                    name: "name",
                    type: "varchar",
                },
                {
                    name: "text",
                    type: "varchar",
                    isNullable: false
                },
                {
                    name: "authorId",
                    type: "int"
                },
                {
                    name: "authorUserId",
                    type: "int"
                }
            ],
            uniques: [{ columnNames: ["name", "text"] }],
            indices: [{ columnNames: ["authorId", "authorUserId"], isUnique: true }],
            foreignKeys: [
                {
                    columnNames: ["id"],
                    referencedTableName: "category",
                    referencedColumnNames: ["questionId"]
                }
            ]
        }));

        await queryRunner.createTable(new Table({
            name: "person",
            columns: [
                {
                    name: "id",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "userId",
                    type: "int",
                    isPrimary: true
                },
                {
                    name: "name",
                    type: "varchar",
                }
            ],
            foreignKeys: [
                {
                    columnNames: ["id", "userId"],
                    referencedTableName: "question",
                    referencedColumnNames: ["authorId", "authorUserId"]
                }
            ]
        }));

        let categoryTable = await queryRunner.getTable("category");
        const categoryTableIdColumn = categoryTable!.findColumnByName("id");
        categoryTableIdColumn!.isPrimary.should.be.true;
        categoryTableIdColumn!.isGenerated.should.be.true;
        categoryTableIdColumn!.generationStrategy!.should.be.equal("increment");
        categoryTable!.should.exist;
        categoryTable!.uniques.length.should.be.equal(3);
        categoryTable!.indices.length.should.be.equal(1);

        let questionTable = await queryRunner.getTable("question");
        const questionIdColumn = questionTable!.findColumnByName("id");
        questionIdColumn!.isPrimary.should.be.true;
        questionIdColumn!.isGenerated.should.be.true;
        questionIdColumn!.generationStrategy!.should.be.equal("increment");
        questionTable!.should.exist;
        questionTable!.uniques.length.should.be.equal(1);
        questionTable!.uniques[0].columnNames.length.should.be.equal(2);
        questionTable!.indices.length.should.be.equal(1);
        questionTable!.indices[0].columnNames.length.should.be.equal(2);
        questionTable!.foreignKeys.length.should.be.equal(1);

        let personTable = await queryRunner.getTable("person");
        const personIdColumn = personTable!.findColumnByName("id");
        const personUserIdColumn = personTable!.findColumnByName("id");
        personIdColumn!.isPrimary.should.be.true;
        personUserIdColumn!.isPrimary.should.be.true;
        personTable!.should.exist;
        personTable!.foreignKeys.length.should.be.equal(1);
        personTable!.foreignKeys[0].columnNames.length.should.be.equal(2);
        personTable!.foreignKeys[0].referencedColumnNames.length.should.be.equal(2);

        await queryRunner.executeMemoryDownSql();
        questionTable = await queryRunner.getTable("question");
        categoryTable = await queryRunner.getTable("category");
        personTable = await queryRunner.getTable("person");
        expect(questionTable).to.be.undefined;
        expect(categoryTable).to.be.undefined;
        expect(personTable).to.be.undefined;

        await queryRunner.release();
    })));

});
