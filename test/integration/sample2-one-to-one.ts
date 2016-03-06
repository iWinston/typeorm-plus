import * as chai from "chai";
import {expect} from "chai";
import {Connection} from "../../src/connection/Connection";
import {TypeORM} from "../../src/TypeORM";
import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {Repository} from "../../src/repository/Repository";
import {SchemaCreator} from "../../src/schema-creator/SchemaCreator";
import {PostDetails} from "../../sample/sample2-one-to-one/entity/PostDetails";
import {Post} from "../../sample/sample2-one-to-one/entity/Post";

chai.should();
describe("insertion", function() {

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
        return TypeORM.createMysqlConnection(options, [Post, PostDetails]).then(conn => {
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
        postDetailsRepository: Repository<PostDetails>;
    before(function() {
        postRepository = connection.getRepository<Post>(Post);
        postDetailsRepository = connection.getRepository<PostDetails>(PostDetails);
    });

    // -------------------------------------------------------------------------
    // Specifications: persist
    // -------------------------------------------------------------------------

    describe("insert post and details", function() {
        let newPost: Post, details: PostDetails, savedPost: Post;
        
        before(reloadDatabase);

        beforeEach(function() {
            details = new PostDetails();
            details.authorName = "Umed";
            details.comment = "this is post";
            details.metadata = "post,posting,postman";
            
            newPost = new Post();
            newPost.text = "Hello post";
            newPost.title = "this is post title";
            newPost.details = details;
            return postRepository.persist(newPost).then(post => savedPost = post);
        });

        it("should return the same post instance after its created", function () {
            savedPost.should.be.equal(newPost);
        });

        it("should return the same post details instance after its created", function () {
            savedPost.details.should.be.equal(newPost.details);
        });

        it("should have a new generated id after post is created", function () {
            expect(savedPost.id).not.to.be.empty;
            expect(savedPost.details.id).not.to.be.empty;
        });

        it("should have inserted post in the database", function() {
            return postRepository.findById(savedPost.id).should.eventually.eql({
                id: savedPost.id,
                text: "Hello post",
                title: "this is post title"
            });
        });

        it("should have inserted post details in the database", function() {
            return postDetailsRepository.findById(savedPost.details.id).should.eventually.eql({
                id: savedPost.details.id,
                authorName: "Umed",
                comment: "this is post",
                metadata: "post,posting,postman"
            });
        });

        it("should load post and its details if left join used", function() {
            return postRepository
                .createQueryBuilder("post")
                .leftJoinAndSelect("post.details", "details")
                .where("post.id=:id")
                .setParameter("id", savedPost.id)
                .getSingleResult()
                .should.eventually.eql({
                    id: savedPost.id,
                    text: "Hello post",
                    title: "this is post title",
                    details: {
                        id: savedPost.details.id,
                        authorName: "Umed",
                        comment: "this is post",
                        metadata: "post,posting,postman"
                    }
                });
        });

        it("should load details and its post if left join used (from reverse side)", function() {
            return postDetailsRepository
                .createQueryBuilder("details")
                .leftJoinAndSelect("details.post", "post")
                .where("details.id=:id")
                .setParameter("id", savedPost.id)
                .getSingleResult()
                .should.eventually.eql({
                    id: savedPost.details.id,
                    authorName: "Umed",
                    comment: "this is post",
                    metadata: "post,posting,postman",
                    post: {
                        id: savedPost.id,
                        text: "Hello post",
                        title: "this is post title",
                    }
                });
        });

    });
    
    // todo: insert objects with different data types: boolean, dates etc.

});