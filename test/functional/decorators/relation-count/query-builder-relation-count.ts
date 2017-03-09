import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Tag} from "./entity/Tag";
import {expect} from "chai";

describe.skip("QueryBuilder > relation-count", () => {

    // const resourceDir = __dirname + "/../../../../../../test/functional/query-builder/join-relation-ids/";

    let connections: Connection[];
    before(() => createTestingConnections({
        entities: [Post, Category, Tag],
        schemaCreate: true,
        dropSchemaOnConnection: true
    }).then(all => connections = all));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("basic functionality", function() {

        it("should count relation in all cases", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const categoryRepository = connection.getRepository(Category);
            const tagRepository = connection.getRepository(Tag);

            const tag = new Tag();
            tag.name = "kids";

            const category1 = new Category();
            category1.name = "kids";

            const category2 = new Category();
            category2.name = "future";

            const firstPost = new Post();
            firstPost.title = "first post";
            firstPost.tag = tag;
            firstPost.categories = [category1, category2];

            const secondPost = new Post();
            secondPost.title = "second post";

            const category3 = new Category();
            category3.name = "future";
            secondPost.categories = [category2];

            await Promise.all([
                tagRepository.persist(tag),
                categoryRepository.persist(category1),
                categoryRepository.persist(category2),
                categoryRepository.persist(category3)
            ]);
            await postRepository.persist(firstPost);
            await postRepository.persist(secondPost);

            let loadedPosts = await postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.tag", "tag")
                .countRelation("post.categories")
                .countRelation("tag.posts")
                .getMany();

            loadedPosts[0].categoriesCount.should.be.equal(2);
            loadedPosts[1].categoriesCount.should.be.equal(1);
            loadedPosts[0].tag.postsCount.should.be.equal(1);

            loadedPosts = await postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.tag", "tag")
                .countRelationAndMap("post.secondCategoriesCount", "post.categories", "tag IS NOT NULL")
                .countRelationAndMap("post.secondTagsCount", "tag.posts")
                .getMany();

            expect(loadedPosts[0].secondCategoriesCount).not.to.be.empty;
            loadedPosts[0].secondCategoriesCount.should.be.equal(2);
            loadedPosts[1].secondCategoriesCount.should.be.equal(0);
            loadedPosts[0].tag.secondTagsCount.should.be.equal(1);

        })));

    });

});
