import {CommandUtils} from "./CommandUtils";
const chalk = require("chalk");

/**
 * Generates a new project with TypeORM.
 */
export class InitCommand {
    command = "init";
    describe = "Generates initial TypeORM project structure. " +
        "If name specified then creates files inside directory called as name. " +
        "If its not specified then creates files inside current directory.";

    builder(yargs: any) {
        return yargs
            .option("c", {
                alias: "connection",
                default: "default",
                describe: "Name of the connection on which to run a query"
            })
            .option("n", {
                alias: "name",
                describe: "Name of the project directory."
            })
            .option("d", {
                alias: "docker",
                describe: "Set to true if docker-compose must be generated as well. False by default."
            });
    }

    async handler(argv: any) {
        try {
            const isDocker = argv.docker !== undefined ? true : false;
            const basePath = process.cwd() + (argv.name ? ("/" + argv.name) : "");
            await CommandUtils.createFile(basePath + "/package.json", InitCommand.getPackageJsonTemplate(), false);
            if (isDocker)
                await CommandUtils.createFile(basePath + "/docker-compose.yml", InitCommand.getDockerComposeTemplate(), false);
            await CommandUtils.createFile(basePath + "/README.md", InitCommand.getReadmeTemplate({ docker: isDocker }), false);
            await CommandUtils.createFile(basePath + "/tsconfig.json", InitCommand.getTsConfigTemplate());
            await CommandUtils.createFile(basePath + "/ormconfig.json", InitCommand.getOrmConfigTemplate());
            await CommandUtils.createFile(basePath + "/src/entity/User.ts", InitCommand.getUserEntityTemplate());
            await CommandUtils.createFile(basePath + "/src/index.ts", InitCommand.getAppIndexTemplate());
            await CommandUtils.createDirectories(basePath + "/src/migration");

            const packageJsonContents = await CommandUtils.readFile(basePath + "/package.json");
            await CommandUtils.createFile(basePath + "/package.json", InitCommand.appendPackageJson(packageJsonContents));

            if (argv.name) {
                console.log(chalk.green(`Project created inside ${chalk.blue(basePath)} directory.`));

            } else {
                console.log(chalk.green(`Project created inside current directory.`));
            }

        } catch (err) {
            console.log(chalk.black.bgRed("Error during project initialization:"));
            console.error(err);
        }
    }

    // -------------------------------------------------------------------------
    // Protected Static Methods
    // -------------------------------------------------------------------------

    /**
     * Gets contents of the ormconfig file.
     */
    protected static getOrmConfigTemplate(): string {
        return JSON.stringify({
            type: "mysql",
            host: "localhost",
            port: 3306,
            username: "test",
            password: "test",
            database: "test",
            syncrhonize: true,
            logging: false,
            entities: [
                "src/entity/**/*.ts"
            ],
            migrations: [
                "src/migration/**/*.ts"
            ],
            subscribers: [
                "src/subscriber/**/*.ts"
            ]
        }, undefined, 3);
    }

    /**
     * Gets contents of the ormconfig file.
     */
    protected static getTsConfigTemplate(): string {
        return JSON.stringify({
            compilerOptions: {
                lib: ["es5", "es6"],
                target: "es5",
                module: "commonjs",
                moduleResolution: "node",
                emitDecoratorMetadata: true,
                experimentalDecorators: true,
                sourceMap: true
            }
        }
        , undefined, 3);
    }

    /**
     * Gets contents of the user entity.
     */
    protected static getUserEntityTemplate(): string {
        return `import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
`;
    }

    /**
     * Gets contents of the main (index) application file.
     */
    protected static getAppIndexTemplate(): string {
        return `import "reflect-metadata";
import {createConnection} from "typeorm";
import {User} from "./entity/User";

createConnection().then(async connection => {

    console.log("Inserting a new user into the database...");
    const user = new User();
    user.firstName = "Timber";
    user.lastName = "Saw";
    user.age = 25;
    await connection.manager.save(user);
    console.log("Saved a new user with id: " + user.id);
    
    console.log("Loading users from the database...");
    const users = await connection.manager.find(User);
    console.log("Loaded users: ", users);
     
    console.log("Here you can setup and run express/koa/any other framework.");
});
`;
    }

    /**
     * Gets contents of the new package.json file.
     */
    protected static getPackageJsonTemplate(): string {
        return JSON.stringify({
            name: "typeorm",
            version: "0.0.1",
            description: "Awesome project developed with TypeORM.",
            devDependencies: {
            },
            dependencies: {
            },
            scripts: {
            }
        }, undefined, 3);
    }

    /**
     * Gets contents of the new docker-compose.yml file.
     */
    protected static getDockerComposeTemplate(): string {
        return `version: '3'
services:

  mysql:
    image: "mysql:5.7.10"
    container_name: "typeorm-mysql"
    ports:
      - "3306:3306"
    environment:
      MYSQL_ROOT_PASSWORD: "admin"
      MYSQL_USER: "test"
      MYSQL_PASSWORD: "test"
      MYSQL_DATABASE: "test"

`;
    }

    /**
     * Gets contents of the new readme.md file.
     */
    protected static getReadmeTemplate(options: { docker: boolean }): string {
        let template = `# Awesome Project Build with TypeORM
        
Steps to run this project:

1. Run \`npm i\` command
`;

        if (options.docker) {
            template += `2. Run \`docker-compose up\` command
`;
        } else {
            template += `2. Setup database settings inside \`ormconfig.json\` file
`;
        }

        template += `3. Run \`npm start\` command
`;
        return template;
    }

    /**
     * Appends to a given package.json template everything needed.
     */
    protected static appendPackageJson(packageJsonContents: string/*, docker: boolean*/): string {
        const packageJson = JSON.parse(packageJsonContents);

        if (!packageJson.devDependencies) packageJson.devDependencies = {};
        Object.assign(packageJson.devDependencies, {
            "ts-node": "3.3.0",
            typescript: "2.5.2"
        });

        if (!packageJson.dependencies) packageJson.dependencies = {};
        Object.assign(packageJson.dependencies, {
            mysql: "2.14.1",
            typeorm: "0.1.0-alpha.42" // require("../package.json").version
        });

        if (!packageJson.scripts) packageJson.scripts = {};
        Object.assign(packageJson.scripts, {
            start: /*(docker ? "docker-compose up && " : "") + */"ts-node src/index.ts"
        });
        return JSON.stringify(packageJson, undefined, 3);
    }

}