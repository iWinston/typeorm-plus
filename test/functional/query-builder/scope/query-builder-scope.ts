import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("query builder > query scope", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should set defalut query scope correctly", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "title#1";
        const post2 = new Post();
        post2.title = "title#2";
        const post3 = new Post();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        const loadedWithDefaultScopePosts = await connection
            .createQueryBuilder()
            .select("post")
            .from(Post, "post")
            .getMany();
        loadedWithDefaultScopePosts!.length.should.be.equal(1);
        loadedWithDefaultScopePosts![0].title.should.be.equals("title#2");

        const loadedWithDefaultScopePost = await connection
            .createQueryBuilder()
            .select("post")
            .from(Post, "post")
            .getOne();
        loadedWithDefaultScopePost!.title.should.be.equals("title#2");

    })));

    it("should set custom query scope correctly", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "title#1";
        const post2 = new Post();
        post2.title = "title#2";
        const post3 = new Post();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        const loadedWithCustomScopePosts = await connection
            .createQueryBuilder()
            .select("post")
            .from(Post, "post")
            .setScope("title3")
            .getMany();

        loadedWithCustomScopePosts!.length.should.be.equal(1);
        loadedWithCustomScopePosts![0].title.should.be.equals("title#3");

        const loadedWithCustomScopePost = await connection
            .createQueryBuilder()
            .select("post")
            .from(Post, "post")
            .setScope("title3")
            .getOne();
        loadedWithCustomScopePost!.title.should.be.equals("title#3");

    })));

    it("should not set query scope when the scope is set to false", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "title#1";
        const post2 = new Post();
        post2.title = "title#2";
        const post3 = new Post();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        const loadedWithoutScopePosts = await connection
            .createQueryBuilder()
            .select("post")
            .from(Post, "post")
            .setScope(false)
            .getMany();

        loadedWithoutScopePosts!.length.should.be.equal(3);
        loadedWithoutScopePosts![0].title.should.be.equals("title#1");
        loadedWithoutScopePosts![1].title.should.be.equals("title#2");
        loadedWithoutScopePosts![2].title.should.be.equals("title#3");

        const loadedWithoutScopePost = await connection
            .createQueryBuilder()
            .select("post")
            .from(Post, "post")
            .setScope(false)
            .getOne();
        loadedWithoutScopePost!.title.should.be.equals("title#1");

    })));
});