import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {PostgresDriver} from "../../../../src/driver/postgres/PostgresDriver";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";

describe("database schema > table-schema", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql", "postgres"],
            schema: "custom",
            dropSchema: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create tables when custom table schema used", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.getTable("post");
        await queryRunner.release();

        const post = new Post();
        post.name = "Post #1";
        await postRepository.save(post);

        const sql = connection.createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

         if (connection.driver instanceof PostgresDriver)
             sql.should.be.equal(`SELECT "post"."id" AS "post_id", "post"."name" AS "post_name" FROM "custom"."post" "post" WHERE "post"."id" = $1`);

         if (connection.driver instanceof SqlServerDriver)
             sql.should.be.equal(`SELECT "post"."id" AS "post_id", "post"."name" AS "post_name" FROM "custom"."post" "post" WHERE "post"."id" = @0`);

        tableSchema!.schema!.should.be.equal("custom");

    })));

});
