import "reflect-metadata";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Counters} from "./entity/Counters";
import {Information} from "./entity/Information";
import {expect} from "chai";

describe("mongodb > embedded columns listeners", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post, Counters, Information],
        enabledDrivers: ["mongodb"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should entity listeners with embedded correctly", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);

        // save few posts
        const post = new Post();
        post.title = "Post";
        post.text = "Everything about post";
        post.counters = new Counters();
        post.counters.information = new Information();
        await postRepository.save(post);

        const loadedPost = await postRepository.findOne({title: "Post"});

        expect(loadedPost).to.be.not.empty;
        expect(loadedPost!.counters).to.be.not.empty;
        loadedPost!.should.be.instanceOf(Post);
        loadedPost!.title.should.be.equal("Post");
        loadedPost!.text.should.be.equal("Everything about post");

        post.title = "Updated post";
        post.counters.information.description = "Hello updated post";
        await postRepository.save(post);

        const loadedUpdatedPost = await postRepository.findOne({title: "Updated post"});

        expect(loadedUpdatedPost).to.be.not.empty;
        expect(loadedUpdatedPost!.counters).to.be.not.empty;
        expect(loadedUpdatedPost!.counters!.likes).to.be.eq(100);
        expect(loadedUpdatedPost!.counters!.information!.description).to.be.not.empty;
        loadedUpdatedPost!.should.be.instanceOf(Post);
        loadedUpdatedPost!.title.should.be.equal("Updated post");
        loadedUpdatedPost!.text.should.be.equal("Everything about post");

        await postRepository.remove(post);

    })));

    it("should store results in correct camelCase format", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getMongoRepository(Post);

        // save few posts
        const post = new Post();
        post.title = "Post";
        post.text = "Everything about post";
        await postRepository.save(post);

        const cursor = postRepository.createCursor();
        const loadedPost = await cursor.next();

        loadedPost.title.should.be.eql("Post");
        loadedPost.text.should.be.eql("Everything about post");

    })));
});
