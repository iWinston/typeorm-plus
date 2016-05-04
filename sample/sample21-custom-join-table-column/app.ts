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

    let author = new Author();
    author.name = "Umed";
    
    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.author = author;

    postRepository
        .persist(post)
        .then(post => {
            console.log("Post has been saved.");
        })
        .catch(error => console.log(error.stack));

}, error => console.log("Cannot connect: ", error));