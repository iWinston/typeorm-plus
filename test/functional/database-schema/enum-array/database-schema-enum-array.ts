import "reflect-metadata";
import {Post, PostType} from "./entity/Post";
import {Connection} from "../../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("database schema > enum arrays", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should correctly create column with collation option", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);

        const post = new Post();
        post.id = 1;
        post.type = [PostType.advertising, PostType.blog];
        post.numbers = [1, 2, 3];
        await postRepository.save(post);

        const loadedPost = await postRepository.findOne(1);
        loadedPost!.should.be.eql({
            id: 1,
            type: [PostType.advertising, PostType.blog],
            numbers: [ 1, 2, 3 ]
        });

    })));

});
