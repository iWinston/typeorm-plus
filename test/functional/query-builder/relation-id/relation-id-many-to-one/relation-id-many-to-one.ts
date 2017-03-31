import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Tag} from "./entity/Tag";

const should = chai.should();

describe("QueryBuilder > relation-id > many-to-one", () => {
    
    // todo: make this feature to work with FindOptions
    // todo: also make sure all new qb features to work with FindOptions
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load ids when loadRelationIdAndMap used with ManyToOne relation", () => Promise.all(connections.map(async connection => {

        const tag = new Tag();
        tag.name = "kids";
        await connection.entityManager.persist(tag);

        const post = new Post();
        post.title = "about kids";
        post.tag = tag;
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.tagId", "post.tag")
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.tagId).to.not.be.empty;
        expect(loadedPost!.tagId).to.be.equal(1);
    })));


});