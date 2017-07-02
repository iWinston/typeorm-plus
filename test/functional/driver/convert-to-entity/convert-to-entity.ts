import "reflect-metadata";
import { expect } from "chai";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { Connection } from "../../../../src/connection/Connection";
import { Post } from "./entity/Post";

describe("driver > convert raw results to entity", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
        schemaCreate: true,
        dropSchemaOnConnection: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it.only("should return null value in entity property when record column is null", () => Promise.all(connections.map(async connection => {
        const userRepository = connection.getRepository<Post>("Post");
        let post = new Post();
        post.id = 1;

        await userRepository.save(post);

        let loadedPost = await userRepository.findOneById(1);
        if (loadedPost) {
            expect(loadedPost.isNew).to.be.equal(null);
        }
    })));
});
