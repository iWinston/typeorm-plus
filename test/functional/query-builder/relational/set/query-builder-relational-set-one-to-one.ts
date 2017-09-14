import "reflect-metadata";
import {Post} from "./entity/Post";
import {Image} from "./entity/Image";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {expect} from "chai";
import {Connection} from "../../../../../src/connection/Connection";

describe("query builder > relational query builder > set operation > one-to-one relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    const image1 = new Image();
    image1.url = "image #1";

    const image2 = new Image();
    image2.url = "image #2";

    const image3 = new Image();
    image3.url = "image #3";

    const post1 = new Post();
    post1.title = "post #1";

    const post2 = new Post();
    post2.title = "post #2";

    const post3 = new Post();
    post3.title = "post #3";

    async function prepareData(connection: Connection) {
        await connection.manager.save(image1);
        await connection.manager.save(image2);
        await connection.manager.save(image3);
        await connection.manager.save(post1);
        await connection.manager.save(post2);
        await connection.manager.save(post3);
    }

    it("should set entity relation of a given entity by entity objects", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Post, "image")
            .of(post1)
            .set(image1);

        const loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.eql({ id: 1, url: "image #1" });

        const loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.undefined;

        const loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.undefined;
    })));

    it("should set entity relation of a given entity by entity id", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Post, "image")
            .of(2)
            .set(2);

        const loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.undefined;

        const loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.eql({ id: 2, url: "image #2" });

        const loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.undefined;
    })));

    it("should set entity relation of a given entity by entity id map", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Post, "image")
            .of({ id: 3 })
            .set({ id: 3 });

        const loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.undefined;

        const loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.undefined;

        const loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.eql({ id: 3, url: "image #3" });
    })));

    it("should set entity relation of a multiple entities", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);

        await connection
            .createQueryBuilder()
            .relation(Post, "image")
            .of([{ id: 1 }, { id: 3 }])
            .set({ id: 3 });

        const loadedPost1 = await connection.manager.findOneById(Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.eql({ id: 3, url: "image #3" });

        const loadedPost2 = await connection.manager.findOneById(Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.undefined;

        const loadedPost3 = await connection.manager.findOneById(Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.eql({ id: 3, url: "image #3" });
    })));

});
