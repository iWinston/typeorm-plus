import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {ConnectionOptions} from "../../src/connection/ConnectionOptions";
import {PostDetails} from "./entity/PostDetails";

// first create a connection
let options: ConnectionOptions = {
    host: "192.168.99.100",
    port: 3306,
    username: "root",
    password: "admin",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, PostDetails]).then(connection => {

    let details = new PostDetails();
    details.authorName = "Umed";
    details.comment = "about post";
    details.metadata = "post,details,one-to-one";
    
    let post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.details = details;

    let postRepository = connection.getRepository<Post>(Post);

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));