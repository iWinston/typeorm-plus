import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("query builder > conditional clause", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should only executes the given closure when the first parameter is a truthy", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "title#1";
        const post2 = new Post();
        post2.title = "title#2";
        const post3 = new Post();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        const truthys = [true, {}, [], 42, "foo", new Date(), -42, 3.14, -3.14, Infinity, -Infinity];

        for (const truthy of truthys) {
            const loadedPosts = await connection
                .createQueryBuilder()
                .select("post")
                .from(Post, "post")
                .when(truthy, qb => qb.where("post.title = 'title#2'"))
                .getMany();
            loadedPosts!.length.should.be.equal(1);
            loadedPosts![0].title.should.be.equals("title#2");

            const loadedPost = await connection
                .createQueryBuilder()
                .select("post")
                .from(Post, "post")
                .when(truthy, qb => qb.where("post.title = 'title#2'"))
                .getOne();
            loadedPost!.title.should.be.equals("title#2");
        }

    })));

    it("should not executes the given closure when the first parameter is a falsy", () => Promise.all(connections.map(async connection => {

        const post1 = new Post();
        post1.title = "title#1";
        const post2 = new Post();
        post2.title = "title#2";
        const post3 = new Post();
        post3.title = "title#3";

        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);

        const falsys = [false, 0, "", null, undefined, NaN];

        for (const falsy of falsys) {
            await connection
                .createQueryBuilder()
                .delete()
                .from(Post, "post")
                .when(falsy, qb => qb.where("post.title = 'title#2'"))
                .execute();

            const loadedPosts = await connection
                .createQueryBuilder()
                .select("post")
                .from(Post, "post")
                .getMany();

            loadedPosts!.length.should.be.equal(0);

            const loadedPost = await connection
                .createQueryBuilder()
                .select("post")
                .from(Post, "post")
                .getOne();
            expect(loadedPost).to.be.undefined;
        }

    })));
});