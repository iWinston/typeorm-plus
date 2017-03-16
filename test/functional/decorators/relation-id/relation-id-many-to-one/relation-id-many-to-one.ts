import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Connection} from "../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Tag} from "./entity/Tag";
import {PostWithoutRelationId} from "./entity/PostWithoutRelationId";

const should = chai.should();

describe.skip("QueryBuilder > relation-id > many-to-one", () => {
    
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

    describe("with RelationId decorator", function() {

        it("should load ids when RelationId decorator used with ManyToOne relation", () => Promise.all(connections.map(async connection => {

            const tag = new Tag();
            tag.name = "kids";
            await connection.entityManager.persist(tag);
            
            const post = new Post();
            post.title = "about kids";
            post.tag = tag;
            await connection.entityManager.persist(post);

            let loadedPost = await connection.entityManager
                .createQueryBuilder(Post, "post")
                .where("post.id = :id", { id: post.id })
                .getOne();

            expect(loadedPost!.tagId).to.not.be.empty;
            expect(loadedPost!.tagId).to.be.equal(1);
        })));


    });

    describe("without RelationId decorator", function() {

        it("should load ids when loadRelationIdAndMap used with ManyToOne relation", () => Promise.all(connections.map(async connection => {

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

    });

});