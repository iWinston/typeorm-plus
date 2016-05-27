import "reflect-metadata";
import {createConnection, CreateConnectionOptions} from "../../src/index";
import {Post} from "./entity/Post";
import {Question} from "./entity/Question";
import {Counters} from "./entity/Counters";

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
    entities: [Post, Question, Counters]
};

createConnection(options).then(connection => {

    let postRepository = connection.getRepository(Post);
    let questionRepository = connection.getRepository(Question);

    const questionPromise = questionRepository.findOneById(1).then(question => {
        if (!question) {
            question = new Question();
            question.title = "Umed";
            return questionRepository.persist(question).then(savedAuthor => {
                return questionRepository.findOneById(1);
            });
        }
        return question;
    });

    const postPromise = postRepository.findOneById(1).then(post => {
        if (!post) {
            post = new Post();
            post.title = "Hello post";
            post.text = "This is post contents";
            return postRepository.persist(post).then(savedPost => {
                return postRepository.findOneById(1);
            });
        }
        return post;
    });

    return Promise.all<any>([questionPromise, postPromise])
        .then(results => {
            const [question, post] = results;
            question.posts = [post];
            return questionRepository.persist(question);
        })
        .then(savedAuthor => {
            console.log("Question has been saved: ", savedAuthor);
        })
        .catch(error => console.log(error.stack));

}, error => console.log("Cannot connect: ", error));