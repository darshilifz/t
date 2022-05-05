import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

export type AdminRoles = "Admin" | "SubAdmin"

//to create tables
// @Entity({ name: "Admin", synchronize: true})
@Entity({ name: "Admin"})
export class Admin {

    @PrimaryGeneratedColumn()
    Admin_Id: number;

    @Column()
    Admin_Name: string;

    @Column({type : "enum", enum: ["Admin", "SubAdmin"], default: "SubAdmin"})
    Admin_Roles: string;

    @Column()
    Admin_Password: string;
}