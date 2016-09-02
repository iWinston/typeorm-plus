import "reflect-metadata";
import {ConnectionOptions, createConnection} from "../../src/index";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";

const options: ConnectionOptions = {
    driver: {
        type: "mysql",
        host: "localhost",
        port: 3306,
        username: "root",
        password: "admin",
        database: "test"
    },
    logging: {
        logQueries: true
    },
    autoSchemaCreate: true,
    entityDirectories: [__dirname + "/entity/*"]
};

createConnection(options).then(connection => {
    let details1 = new PostDetails();
    details1.comment = "People";

    let details2 = new PostDetails();
    details2.comment = "Human";

    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.details = [details1, details2];

    let postRepository = connection.getRepository(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));