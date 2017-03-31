import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Tag} from "./entity/Tag";
import {Post} from "./entity/Post";

const should = chai.should();

describe("QueryBuilder > relation-id > one-to-one", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchemaOnConnection: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));


    it("should load ids when loadRelationIdAndMap used with OneToOne owner side relation", () => Promise.all(connections.map(async connection => {

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


    it.skip("should throw exception when loadRelationIdAndMap used with OneToOne relation and additional condition is specified", () => Promise.all(connections.map(async connection => {

        const tag = new Tag();
        tag.name = "kids";
        await connection.entityManager.persist(tag);

        const post = new Post();
        post.title = "about kids";
        post.tag = tag;
        await connection.entityManager.persist(post);

        let loadedPost = await connection.entityManager
            .createQueryBuilder(Post, "post")
            .loadRelationIdAndMap("post.tagId", "post.tag", "tag", qb => qb.where("tag.id = :postId", { tagId: 1 }))
            .where("post.id = :id", { id: post.id })
            .getOne();

        expect(loadedPost!.tagId).to.not.be.empty;
        expect(loadedPost!.tagId).to.be.equal(1);
    })));

    it("should load id when loadRelationIdAndMap used with OneToOne inverse side relation", () => Promise.all(connections.map(async connection => {

        const tag = new Tag();
        tag.name = "cars";
        await connection.entityManager.persist(tag);

        const post = new Post();
        post.title = "about BMW";
        post.tag2 = tag;
        await connection.entityManager.persist(post);

        let loadedTag = await connection.entityManager
            .createQueryBuilder(Tag, "tag")
            .loadRelationIdAndMap("tag.postId", "tag.post")
            .getOne();

        expect(loadedTag!.postId).to.not.be.empty;
        expect(loadedTag!.postId).to.be.equal(1);
    })));

});