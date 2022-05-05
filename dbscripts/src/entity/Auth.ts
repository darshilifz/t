import {Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn} from "typeorm";
import { User_Profile } from "./User_Profile";

//to create tables
// @Entity({ name: "Auth", synchronize: true})
@Entity({ name: "Auth"})
export class Auth {

    @PrimaryGeneratedColumn()
    Auth_Id: number;

    @OneToOne(type => User_Profile, user => user.User_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    User_Id: User_Profile;

    @Column({type: "varchar", length: 255,nullable: true })
    Jwt_Token: string;

    @Column()
    Currently_Playing: boolean;

    @Column({type: "varchar",nullable: true })
    Device_Id: string;
}