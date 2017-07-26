import "reflect-metadata";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";

describe("database schema > column collation > mysql", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mysql"],
            schemaCreate: true,
            dropSchemaOnConnection: true,
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("all types should work correctly - persist and hydrate", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const queryRunner = connection.createQueryRunner();
        const tableSchema = await queryRunner.loadTableSchema("post");
        await queryRunner.release();

        const post = new Post();
        post.id = 1;
        post.name = "Post";
        post.title = "Post #1";
        post.description = "This is post";
        await postRepository.save(post);

        tableSchema!.findColumnByName("name")!.charset!.should.be.equal("ascii");
        tableSchema!.findColumnByName("name")!.collation!.should.be.equal("ascii_general_ci");
        tableSchema!.findColumnByName("title")!.charset!.should.be.equal("utf8");
        tableSchema!.findColumnByName("title")!.collation!.should.be.equal("utf8_general_ci");
        tableSchema!.findColumnByName("description")!.charset!.should.be.equal("cp852");
        tableSchema!.findColumnByName("description")!.collation!.should.be.equal("cp852_general_ci");

    })));

});
