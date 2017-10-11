import "reflect-metadata";
import {expect} from "chai";
import {createConnection} from "../../../src/index";
import {SqljsDriver} from "../../../src/driver/sqljs/SqljsDriver";
import {Post} from "./entity/Post";

describe("sqljs driver > options", () => {

    it("should load and save from/to the location option", async () => {
        let connection = await createConnection({
            type: "sqljs",
            entities: [Post],
            location: "test/functional/sqljs/sqlite/test.sqlite"
        });

        const driver = connection.driver as SqljsDriver;
        
        const repository = connection.getRepository(Post);
        let post = new Post();
        post.title = "A post";
        await repository.save(post);

        driver.save();

        await connection.dropDatabase();
        await driver.connect();

        const savedPost = await repository.findOne({title: "A post"});

        expect(savedPost).not.to.be.undefined;
        if (savedPost) {
            expect(savedPost.title).to.be.equal("A post");
        }
    });
});
