import "reflect-metadata";
import * as chai from "chai";
import {expect} from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Tag} from "./entity/Tag";

const should = chai.should();

describe("QueryBuilder > relation-id", () => {
    
    // const resourceDir = __dirname + "/../../../../../../test/functional/query-builder/join-relation-ids/";
    // todo: make this feature to work with FindOptions
    // todo: also make sure all new qb features to work with FindOptions
    
    let connections: Connection[];
    before(() => createTestingConnections({ entities: [Post, Category, Tag], schemaCreate: true, dropSchemaOnConnection: true }).then(all => connections = all));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("basic functionality", function() {

        it("should load ids probably in all cases", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);
            const tagRepository = connection.getRepository(Tag);
            
            const tag = new Tag();
            tag.name = "kids";

            const category1 = new Category();
            category1.name = "kids";
            
            const category2 = new Category();
            category2.name = "future";
            
            const post = new Post();
            post.title = "about kids";
            post.tag = tag;
            post.categories = [category1, category2];

            const emptyPost = new Post();
            emptyPost.title = "second post";
            
            await Promise.all([
                postRepository.persist(emptyPost),
                tagRepository.persist(tag),
                categoryRepository.persist(category1),
                categoryRepository.persist(category2)
            ]);
            await postRepository.persist(post);
            
            post.title.should.be.equal("about kids");
            expect(post.tag.id).to.not.be.empty;
            expect(post.categories[0].id).to.not.be.empty;
            expect(post.categories[1].id).to.not.be.empty;

            /*let loadedPost = (await postRepository
                .createQueryBuilder("post")
                .leftJoinRelationId("post.categories")
                .where("post.id = :id", { id: post.id })
                .getOne())!;

            expect(loadedPost.tagId).to.not.be.empty;
            expect(loadedPost.tagId).to.be.equal(1);
            expect(loadedPost.categoryIds).to.not.be.empty;
            expect(loadedPost.categoryIds).to.contain(1);
            expect(loadedPost.categoryIds).to.contain(2);*/

            /*loadedPost = (await postRepository
                .createQueryBuilder("post")
                .leftJoinRelationId("post.categories", "categories", "categories.id = :categoryId")
                .where("post.id = :id", { id: post.id })
                .setParameter("categoryId", 1)
                .getOne())!;

            expect(loadedPost.tagId).to.not.be.empty;
            expect(loadedPost.tagId).to.be.equal(1);
            expect(loadedPost.categoryIds).to.not.be.empty;
            expect(loadedPost.categoryIds.length).to.equal(1);
            expect(loadedPost.categoryIds).to.contain(1);

            let loadedEmptyPost = (await postRepository
                .createQueryBuilder("post")
                .leftJoinRelationId("post.categories")
                .where("post.id = :id", { id: emptyPost.id })
                .getOne())!;

            should.not.exist(loadedEmptyPost.tagId);
            should.not.exist(loadedEmptyPost.categoryIds);

            loadedEmptyPost = (await postRepository
                .createQueryBuilder("post")
                .innerJoinRelationId("post.categories")
                .where("post.id = :id", { id: emptyPost.id })
                .getOne())!;

            should.not.exist(loadedEmptyPost);

            loadedPost = (await postRepository
                .createQueryBuilder("post")
                .leftJoinRelationIdAndMap("post.allCategoryIds", "post.categories")
                .where("post.id = :id", { id: post.id })
                .getOne())!;

            loadedPost.allCategoryIds.should.contain(1);
            loadedPost.allCategoryIds.should.contain(2);*/
        })));

    });

});
