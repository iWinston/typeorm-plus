import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../src/connection/Connection";
import {TypeORM} from "../../src/TypeORM";
import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {Repository} from "../../src/repository/Repository";
import {SchemaCreator} from "../../src/schema-creator/SchemaCreator";
import {PostDetails} from "../../sample/sample4-many-to-many/entity/PostDetails";
import {Post} from "../../sample/sample4-many-to-many/entity/Post";
import {PostCategory} from "../../sample/sample4-many-to-many/entity/PostCategory";
import {PostAuthor} from "../../sample/sample4-many-to-many/entity/PostAuthor";
import {PostMetadata} from "../../sample/sample4-many-to-many/entity/PostMetadata";
import {PostImage} from "../../sample/sample4-many-to-many/entity/PostImage";
import {PostInformation} from "../../sample/sample4-many-to-many/entity/PostInformation";

chai.should();
describe("many-to-many", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let options: ConnectionOptions = {
        host: "192.168.99.100",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test",
        autoSchemaCreate: true
    };
    
    // connect to db
    let connection: Connection;
    before(function() {
        return TypeORM.createMysqlConnection(options, [Post, PostDetails, PostCategory, PostMetadata, PostImage, PostInformation, PostAuthor]).then(conn => {
            connection = conn;
        }).catch(e => console.log("Error during connection to db: " + e));
    });

    after(function() {
        connection.close();
    });

    // clean up database before each test
    function reloadDatabase() {
        return connection.driver
            .clearDatabase()
            .then(() => new SchemaCreator(connection).create());
    }

    let postRepository: Repository<Post>,
        postDetailsRepository: Repository<PostDetails>,
        postCategoryRepository: Repository<PostCategory>,
        postImageRepository: Repository<PostImage>,
        postMetadataRepository: Repository<PostMetadata>;
    before(function() {
        postRepository = connection.getRepository<Post>(Post);
        postDetailsRepository = connection.getRepository<PostDetails>(PostDetails);
        postCategoryRepository = connection.getRepository<PostCategory>(PostCategory);
        postImageRepository = connection.getRepository<PostImage>(PostImage);
        postMetadataRepository = connection.getRepository<PostMetadata>(PostMetadata);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("insert post and details (has inverse relation + full cascade options)", function() {
        let newPost: Post, details: PostDetails, savedPost: Post;
        
        before(reloadDatabase);

        before(function() {
            details = new PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";
            
            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details.push(details);
            
            return postRepository.persist(newPost).then(post => savedPost = post);
        });

        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });

        it("should return the same post details instance after its created", function () {
            savedPost.details[0].should.be.equal(newPost.details[0]);
        });

        it("should have a new generated id after post is created", function () {
            expect(savedPost.id).not.to.be.empty;
            expect(savedPost.details[0].id).not.to.be.empty;
        });

        it("should have inserted post in the database", function() {
            const expectedPost = new Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            
            return postRepository.findById(savedPost.id).should.eventually.eql(expectedPost);
        });

        it("should have inserted post details in the database", function() {
            const expectedDetails = new PostDetails();
            expectedDetails.id = savedPost.details[0].id;
            expectedDetails.authorName = savedPost.details[0].authorName;
            expectedDetails.comment = savedPost.details[0].comment;
            expectedDetails.metadata = savedPost.details[0].metadata;
            
            return postDetailsRepository.findById(savedPost.details[0].id).should.eventually.eql(expectedDetails);
        });

        it("should load post and its details if left join used", function() {
            const expectedPost = new Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            expectedPost.details.push(new PostDetails());
            expectedPost.details[0].id = savedPost.details[0].id;
            expectedPost.details[0].authorName = savedPost.details[0].authorName;
            expectedPost.details[0].comment = savedPost.details[0].comment;
            expectedPost.details[0].metadata = savedPost.details[0].metadata;
            
            return postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.details", "details")
                .where("post.id=:id")
                .setParameter("id", savedPost.id)
                .getSingleResult()
                .should.eventually.eql(expectedPost);
        });

        it("should load details and its post if left join used (from reverse side)", function() {

            const expectedDetails = new PostDetails();
            expectedDetails.id = savedPost.details[0].id;
            expectedDetails.authorName = savedPost.details[0].authorName;
            expectedDetails.comment = savedPost.details[0].comment;
            expectedDetails.metadata = savedPost.details[0].metadata;

            const expectedPost = new Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            
            expectedDetails.posts.push(expectedPost);
            
            return postDetailsRepository
                .createQueryBuilder("details")
                .leftJoinAndSelect("details.posts", "posts")
                .where("details.id=:id")
                .setParameter("id", savedPost.id)
                .getSingleResult()
                .should.eventually.eql(expectedDetails);
        });

        it("should load saved post without details if left joins are not specified", function() {
            const expectedPost = new Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            
            return postRepository
                .createQueryBuilder("post")
                .where("post.id=:id", { id: savedPost.id })
                .getSingleResult()
                .should.eventually.eql(expectedPost);
        });

        it("should load saved post without details if left joins are not specified", function() {
            const expectedDetails = new PostDetails();
            expectedDetails.id = savedPost.details[0].id;
            expectedDetails.authorName = savedPost.details[0].authorName;
            expectedDetails.comment = savedPost.details[0].comment;
            expectedDetails.metadata = savedPost.details[0].metadata;
            
            return postDetailsRepository
                .createQueryBuilder("details")
                .where("details.id=:id", { id: savedPost.id })
                .getSingleResult()
                .should.eventually.eql(expectedDetails);
        });

    });

    describe("insert post and category (one-side relation)", function() {
        let newPost: Post, category: PostCategory, savedPost: Post;

        before(reloadDatabase);

        before(function() {
            category = new PostCategory();
            category.name = "technology";

            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.category.push(category);

            return postRepository.persist(newPost).then(post => savedPost = post);
        });

        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });

        it("should return the same post category instance after its created", function () {
            savedPost.category.should.be.equal(newPost.category);
        });

        it("should have a new generated id after post is created", function () {
            expect(savedPost.id).not.to.be.empty;
            expect(savedPost.category[0].id).not.to.be.empty;
        });

        it("should have inserted post in the database", function() {
            const expectedPost = new Post();
            expectedPost.id = savedPost.id;
            expectedPost.text = savedPost.text;
            expectedPost.title = savedPost.title;
            return postRepository.findById(savedPost.id).should.eventually.eql(expectedPost);
        });

        it("should have inserted category in the database", function() {
            const expectedPost = new PostCategory();
            expectedPost.id = savedPost.category[0].id;
            expectedPost.name = "technology";
            return postCategoryRepository.findById(savedPost.category[0].id).should.eventually.eql(expectedPost);
        });

        it("should load post and its category if left join used", function() {
            const expectedPost = new Post();
            expectedPost.id = savedPost.id;
            expectedPost.title = savedPost.title;
            expectedPost.text = savedPost.text;
            expectedPost.category.push(new PostCategory());
            expectedPost.category[0].id = savedPost.category[0].id;
            expectedPost.category[0].name = savedPost.category[0].name;

            return postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.category", "category")
                .where("post.id=:id", { id: savedPost.id })
                .getSingleResult()
                .should.eventually.eql(expectedPost);
        });

        it("should load details and its post if left join used (from reverse side)", function() {
            // later need to specify with what exception we reject it
            /*return postCategoryRepository
                .createQueryBuilder("category")
                .leftJoinAndSelect("category.post", "post")
                .where("category.id=:id", { id: savedPost.id })
                .getSingleResult()
                .should.be.rejectedWith(Error);*/ // not working, find fix
        });
        
    });

    describe("cascade updates should not be executed when cascadeUpdate option is not set", function() {
        let newPost: Post, details: PostDetails, savedPost: Post;

        before(reloadDatabase);

        before(function() {

            details = new PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";

            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details.push(details);

            return postRepository
                .persist(newPost)
                .then(post => savedPost = post);
        });

        it("should ignore updates in the model and do not update the db when entity is updated", function () {
            newPost.details[0].comment = "i am updated comment";
            return postRepository.persist(newPost).then(updatedPost => {
                updatedPost.details[0].comment.should.be.equal("i am updated comment");
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id=:id")
                    .setParameter("id", updatedPost.id)
                    .getSingleResult();
            }).then(updatedPostReloaded => {
                updatedPostReloaded.details[0].comment.should.be.equal("this is post");
            });
        }); // todo: also check that updates throw exception in strict cascades mode
    });

    describe("cascade remove should not be executed when cascadeRemove option is not set", function() {
        let newPost: Post, details: PostDetails, savedPost: Post;

        before(reloadDatabase);

        before(function() {

            details = new PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";

            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details.push(details);

            return postRepository
                .persist(newPost)
                .then(post => savedPost = post);
        });

        it("should remove relation however should not remove details itself", function () {
            newPost.details = null;
            return postRepository.persist(newPost).then(updatedPost => {
                return postRepository
                    .createQueryBuilder("post")
                    .leftJoinAndSelect("post.details", "details")
                    .where("post.id=:id")
                    .setParameter("id", updatedPost.id)
                    .getSingleResult();
            }).then(updatedPostReloaded => {
                expect(updatedPostReloaded.details).to.be.empty;

                return postDetailsRepository
                    .createQueryBuilder("details")
                    .leftJoinAndSelect("details.posts", "posts")
                    .where("details.id=:id")
                    .setParameter("id", details.id)
                    .getSingleResult();
            }).then(reloadedDetails => {
                expect(reloadedDetails).not.to.be.empty;
                expect(reloadedDetails.posts).to.be.empty;
            });
        });
    });
    
    return;

    describe("cascade updates should be executed when cascadeUpdate option is set", function() {
        let newPost: Post, newImage: PostImage, savedImage: PostImage;

        before(reloadDatabase);

        it("should update a relation successfully when updated", function () {

            newImage = new PostImage();
            newImage.url = "logo.png";

            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";

            return postImageRepository
                .persist(newImage)
                .then(image => {
                    savedImage = image;
                    newPost.image.push(image);
                    return postRepository.persist(newPost);

                }).then(post => {
                    newPost = post;
                    return postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.image", "image")
                        .where("post.id=:id")
                        .setParameter("id", post.id)
                        .getSingleResult();

                }).then(loadedPost => {
                    loadedPost.image[0].url = "new-logo.png";
                    return postRepository.persist(loadedPost);

                }).then(() => {
                    return postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.image", "image")
                        .where("post.id=:id")
                        .setParameter("id", newPost.id)
                        .getSingleResult();
                    
                }).then(reloadedPost => {
                    reloadedPost.image[0].url.should.be.equal("new-logo.png");
                });
        });

    });

    describe("cascade remove should be executed when cascadeRemove option is set", function() {
        let newPost: Post, newMetadata: PostMetadata, savedMetadata: PostMetadata;

        before(reloadDatabase);

        it("should remove a relation entity successfully when removed", function () {

            newMetadata = new PostMetadata();
            newMetadata.description = "this is post metadata";

            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";

            return postMetadataRepository
                .persist(newMetadata)
                .then(metadata => {
                    savedMetadata = metadata;
                    newPost.metadata.push(metadata);
                    return postRepository.persist(newPost);

                }).then(post => {
                    newPost = post;
                    return postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.metadata", "metadata")
                        .where("post.id=:id")
                        .setParameter("id", post.id)
                        .getSingleResult();

                }).then(loadedPost => {
                    loadedPost.metadata = null;
                    return postRepository.persist(loadedPost);

                }).then(() => {
                    return postRepository
                        .createQueryBuilder("post")
                        .leftJoinAndSelect("post.metadata", "metadata")
                        .where("post.id=:id")
                        .setParameter("id", newPost.id)
                        .getSingleResult();

                }).then(reloadedPost => {
                    expect(reloadedPost.metadata).to.be.empty;
                });
        });

    });

    describe("insert post details from reverse side", function() {
        let newPost: Post, details: PostDetails, savedDetails: PostDetails;

        before(reloadDatabase);

        before(function() {
            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";

            details = new PostDetails();
            details.comment = "post details comment";
            details.posts.push(newPost);

            return postDetailsRepository.persist(details).then(details => savedDetails = details);
        });

        it("should return the same post instance after its created", function () {
            savedDetails.posts[0].should.be.equal(newPost);
        });

        it("should return the same post details instance after its created", function () {
            savedDetails.should.be.equal(details);
        });

        it("should have a new generated id after post is created", function () {
            expect(savedDetails.id).not.to.be.empty;
            expect(details.id).not.to.be.empty;
        });

        it("should have inserted post in the database", function() {
            const expectedPost = new Post();
            expectedPost.id = newPost.id;
            expectedPost.text = newPost.text;
            expectedPost.title = newPost.title;
            return postRepository.findById(savedDetails.id).should.eventually.eql(expectedPost);
        });

        it("should have inserted details in the database", function() {
            const expectedDetails = new PostDetails();
            expectedDetails.id = details.id;
            expectedDetails.comment = details.comment;
            return postDetailsRepository.findById(details.id).should.eventually.eql(expectedDetails);
        });

        it("should load post and its details if left join used", function() {
            const expectedDetails = new PostDetails();
            expectedDetails.id = savedDetails.id;
            expectedDetails.comment = savedDetails.comment;
            expectedDetails.posts.push(new Post());
            expectedDetails.posts[0].id = newPost.id;
            expectedDetails.posts[0].text = newPost.text;
            expectedDetails.posts[0].title = newPost.title;

            return postDetailsRepository
                .createQueryBuilder("details")
                .leftJoinAndSelect("details.posts", "posts")
                .where("details.id=:id", { id: savedDetails.id })
                .getSingleResult()
                .should.eventually.eql(expectedDetails);
        });

    });

});