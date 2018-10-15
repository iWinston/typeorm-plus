import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {PostCategory} from "./entity/PostCategory";

describe("other issues > entity change in subscribers should affect persistence", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("if entity was changed, subscriber should be take updated columns", () => Promise.all(connections.map(async function(connection) {

        const category1 = new PostCategory();
        category1.name = "category #1";

        const post = new Post();
        post.title = "hello world";
        post.category = category1;
        await connection.manager.save(post);

        // check if it was inserted correctly
        const loadedPost = await connection.manager.findOne(Post);
        expect(loadedPost).not.to.be.empty;
        loadedPost!.active.should.be.equal(false);

        // now update some property and let update listener trigger
        const category2 = new PostCategory();
        category2.name = "category #2";
        loadedPost!.category = category2;
        loadedPost!.active = true;
        await connection.manager.save(loadedPost!);

        // check if update listener was triggered and entity was really updated by the changes in the listener
        const loadedUpdatedPost = await connection.manager.findOne(Post);

        expect(loadedUpdatedPost).not.to.be.empty;
        expect(loadedUpdatedPost!.updatedColumns).to.have.members(["active"]);
        expect(loadedUpdatedPost!.updatedRelations).to.have.members(["category"]);

        await connection.manager.save(loadedPost!);
        await connection.manager.save(loadedPost!);
        await connection.manager.save(loadedPost!);
        await connection.manager.save(loadedPost!);

    })));

});
