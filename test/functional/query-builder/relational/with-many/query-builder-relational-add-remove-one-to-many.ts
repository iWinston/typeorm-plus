import "reflect-metadata";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {expect} from "chai";
import {Connection} from "../../../../../src/connection/Connection";

describe("query builder > relational query builder > add operation > one to many relation", () => {

    let connections: Connection[];
    let category1: Category,
        category2: Category,
        category3: Category,
        post1: Post,
        post2: Post,
        post3: Post,
        loadedPost1: Post|undefined,
        loadedPost2: Post|undefined,
        loadedPost3: Post|undefined;

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    async function prepareData(connection: Connection) {

        category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(category1);

        category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(category2);

        category3 = new Category();
        category3.name = "category #3";
        await connection.manager.save(category3);

        post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(post1);

        post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(post2);

        post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(post3);
    }

    it("should add entity relation of a given entity by entity objects", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category1)
            .add(post1);

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 1, name: "category #1" });

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.undefined;

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category1)
            .remove(post1);

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.undefined;

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.undefined;
    })));

    it("should add entity relation of a given entity by entity id", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(2) // category id
            .add(2); // post id

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.undefined;

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.eql({ id: 2, name: "category #2" });

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.undefined;

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(2) // category id
            .remove(2); // post id

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.undefined;

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.undefined;
    })));

    it("should add entity relation of a given entity by entity id map", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category id
            .add({ id: 3 }); // post id

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.undefined;

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.eql({ id: 3, name: "category #3" });

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category id
            .remove({ id: 3 }); // post id

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.undefined;

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.undefined;
    })));

    it("should add multiple entities into relation of a multiple entities", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category
            .add([{ id: 1 }, { id: 3 }]); // posts

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 3, name: "category #3" });

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.eql({ id: 3, name: "category #3" });

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category
            .remove([{ id: 1 }, { id: 3 }]); // posts

        loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.undefined;

        loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.undefined;

        loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.undefined;
    })));

    it.only("should handle addAndRemove method as well", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        // add initial data
        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category3) // category
            .add(post2); // post

        loadedPost1 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 3, name: "category #3" });

        // when nothing is specified nothing should be performed
        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category3) // category
            .addAndRemove([], []); // post

        loadedPost1 = await connection.manager.findOneById(Post, 2, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 3, name: "category #3" });

        // now add and remove =)
        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category3) // category
            .addAndRemove([post1, post3], [post2]); // post

        const loadedCategory = await connection.manager.findOneById(Category, 3, { relations: ["posts"] });
        expect(loadedCategory!.posts).to.contain({ id: 1, title: "post #1" });
        expect(loadedCategory!.posts).to.not.contain({ id: 2, title: "post #2" });
        expect(loadedCategory!.posts).to.contain({ id: 3, title: "post #3" });
    })));

});
