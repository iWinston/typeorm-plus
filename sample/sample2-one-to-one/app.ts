import {TypeORM} from "../../src/TypeORM";
import {Post} from "./entity/Post";
import {PostDetails} from "./entity/PostDetails";
import {Image} from "./entity/Image";
import {ImageDetails} from "./entity/ImageDetails";

// first create a connection
let options = {
    host: "192.168.99.100",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    autoSchemaCreate: true
};

TypeORM.createMysqlConnection(options, [Post, PostDetails, Image, ImageDetails]).then(connection => {

    const postJson = {
        id: 1,
        text: "This is post about hello",
        title: "hello",
        details: {
            id: 1,
            comment: "This is post about hello",
            meta: "about-hello"
        }
    };
    
    let postRepository = connection.getRepository<Post>(Post);
    return postRepository.findById(1).then(post => {
        console.log(post);
    }, err => console.log(err));

    return;

    let details = new PostDetails();
    details.comment = "This is post about hello";
    details.meta = "about-hello";

    const post = new Post();
    post.text = "Hello how are you?";
    post.title = "hello";
    post.details = details;

    postRepository
        .persist(post)
        .then(post => console.log("Post has been saved"))
        .catch(error => console.log("Cannot save. Error: ", error));

}, error => console.log("Cannot connect: ", error));