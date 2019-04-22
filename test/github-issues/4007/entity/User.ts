import { Column, ValueTransformer, Entity, PrimaryGeneratedColumn } from "../../../../src";

export const encode: ValueTransformer = {
    to: (entityValue: string) => {
        return encodeURI(entityValue);
    },
    from: (databaseValue: string) => {
        return decodeURI(databaseValue);
    },
};

export const lowercase: ValueTransformer = {
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

    @Column({transformer: [lowercase, encode]})
    email: string;
}