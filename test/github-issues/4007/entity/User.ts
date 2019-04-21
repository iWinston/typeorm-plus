import { Column, ValueTransformer, Entity, PrimaryGeneratedColumn } from "../../../../src";

const encrypt: ValueTransformer = {
    to: (entityValue: string) => {
        return Buffer.from(entityValue).toString("base64");
    },
    from: (databaseValue: string) => {
        return Buffer.from(databaseValue, "base64").toString();
    },
};

const lowercase: ValueTransformer = {
    to: (entityValue: string) => {
        return entityValue.toLocaleLowerCase();
    },
    from: (databaseValue: string) => {
        return databaseValue;
    }
};

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({transformer: [lowercase, encrypt]})
    email: string;
}