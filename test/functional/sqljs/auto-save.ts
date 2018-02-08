import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {createTestingConnections} from "../../utils/test-utils";

describe.skip("sqljs driver > autosave", () => {
    it("should call autoSaveCallback on insert, update and delete", async () => {
        let saves = 0;
        const callback = (database: Uint8Array) => {
            saves++;
        };

        let connections = await createTestingConnections({
            enabledDrivers: ["sqljs"],
            entities: [Post],
            schemaCreate: true,
            driverSpecific: {
                autoSaveCallback: callback,
                autoSave: true
            }
        });

        const connection = connections[0];

        let posts = [
            {
                title: "second post"
            },
            {
                title: "third post"
            }
        ];

        await connection.createQueryBuilder().insert().into(Post).values(posts).execute();
        await connection.createQueryBuilder().update(Post).set({title: "Many posts"}).execute();
        await connection.createQueryBuilder().delete().from(Post).where("title = ?", {title: "third post"}).execute();
        
        const repository = connection.getRepository(Post);
        let post = new Post();
        post.title = "A post";
        await repository.save(post);

        let savedPost = await repository.findOne({title: "A post"});

        expect(savedPost).not.to.be.undefined;

        if (savedPost) {
            savedPost.title = "A updated post";
            await repository.save(savedPost);
            await repository.remove(savedPost);
        }

        await connection.close();

        expect(saves).to.be.equal(7);
    });

    it("should not call autoSaveCallback when autoSave is disabled", async () => {
        let saves = 0;
        const callback = (database: Uint8Array) => {
            saves++;
        };
        
        let connections = await createTestingConnections({
            enabledDrivers: ["sqljs"],
            entities: [Post],
            schemaCreate: true,
            driverSpecific: {
                autoSaveCallback: callback,
                autoSave: false
            }
        });

        let connection = connections[0];
        
        const repository = connection.getRepository(Post);
        let post = new Post();
        post.title = "A post";
        await repository.save(post);

        let savedPost = await repository.findOne({title: "A post"});

        expect(savedPost).not.to.be.undefined;

        if (savedPost) {
            savedPost.title = "A updated post";
            await repository.save(savedPost);
            await repository.remove(savedPost);
        }

        await connection.close();

        expect(saves).to.be.equal(0);
    });
});
