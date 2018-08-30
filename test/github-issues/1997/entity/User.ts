import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src";

export enum Status {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

@Entity({schema: "schema"})
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("enum", { enum: Status, default: Status.ACTIVE })
  status: Status;
}
