import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Tag} from "./entity/Tag";
import {PostWithoutRelationId} from "./entity/PostWithoutRelationId";

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

    describe("with RelationId decorator", function() {


    });

    describe("without RelationId decorator", function() {

        it.skip("should load ids when loadRelationIdAndMap used with OneToOne owner side relation", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "kids";
            await connection.entityManager.persist(tag);

            const post = new PostWithoutRelationId();
            post.title = "about kids";
            post.tag = tag;
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(PostWithoutRelationId, "post")
                .loadRelationIdAndMap("post.tag", "post.tag")
                .where("post.id = :id", { id: post.id })
                .getOne();

            expect(loadedPost!.tagId).to.not.be.empty;
            expect(loadedPost!.tagId).to.be.equal(1);
        })));

        it("should load id when loadRelationIdAndMap used with OneToOne inverse side relation", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "cars";
            await connection.entityManager.persist(tag);

            const post = new PostWithoutRelationId();
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

});