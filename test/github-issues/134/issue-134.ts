import "reflect-metadata";
import { createTestingConnections, closeTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import { expect } from "chai";

describe("github issues > #134 Error TIME is converted to 'HH-mm' instead of 'HH:mm", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));


    it("should successfully persist the post with creationDate in HH:mm and return persisted entity", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const post = new Post();
        const currentDate = new Date();
        post.title = "Hello Post #1";
        post.creationDate = currentDate;


        const savedPost = await postRepository.persist(post);
        const loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .where("post.id=:id", { id: savedPost.id })
            .getOne();


        expect(post).not.to.be.empty;
        expect(loadedPost).not.to.be.empty;
        expect(loadedPost).to.be.eql(savedPost);


    })));



});
