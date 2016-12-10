import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {Author} from "./entity/Author";

const options: ConnectionOptions = {
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    autoSchemaSync: true,
    logging: {
        // logQueries: true,
        // logSchemaCreation: true,
        // logFailedQueryError: true
    },
    entities: [Post, Author],
};

createConnection(options).then(async connection => {

    let author = new Author();
    author.firstName = "Umed";
    author.lastName = "Khudoiberdiev";

    let post = new Post();
    post.title = "hello";
    post.author = author;

    let postRepository = connection.getRepository(Post);

    await postRepository.persist(post);
    console.log("Post has been saved");

}).catch(error => console.log("Error: ", error));