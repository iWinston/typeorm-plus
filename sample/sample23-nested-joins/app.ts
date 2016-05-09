import {createConnection, CreateConnectionOptions} from "../../src/typeorm";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";
import {Category} from "./entity/Category";

const options: CreateConnectionOptions = {
    driver: "mysql",
    connection: {
        host: "192.168.99.100",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test",
        autoSchemaCreate: true,
        logging: {
            logOnlyFailedQueries: true,
            logFailedQueryError: true
        }
    },
    entities: [Post, Author, Category]
};

createConnection(options).then(connection => {

    let postRepository = connection.getRepository(Post);
    
    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";

    postRepository
        .persist(post)
        .then(post => {
            return postRepository
                .createQueryBuilder("post")
                .leftJoin("post.categories", "categories")
                .leftJoin("categories.author", "author")
                .where("post.id=1")
                .getSingleResult();
        })
        .then(loadedPost => {
            console.log("loadedPosts: ", loadedPost);
        })
        .catch(error => console.log(error.stack));

}, error => console.log("Cannot connect: ", error));