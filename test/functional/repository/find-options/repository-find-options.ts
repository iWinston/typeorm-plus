import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";

describe("repository > find options", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load relations", () => Promise.all(connections.map(async connection => {

        const user = new User();
        user.name = "Alex Messer";
        await connection.manager.save(user);

        const category = new Category();
        category.name = "Boys";
        await connection.manager.save(category);

        const post = new Post();
        post.title = "About Alex Messer";
        post.author = user;
        post.categories = [category];
        await connection.manager.save(post);

        const loadedPost = await connection.getRepository(Post).findOne({
            relations: ["author", "categories"]
        });
        expect(loadedPost).to.be.eql({
            id: 1,
            title: "About Alex Messer",
            author: {
                id: 1,
                name: "Alex Messer"
            },
            categories: [{
                id: 1,
                name: "Boys"
            }]
        });

    })));

});