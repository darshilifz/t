import {Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, OneToOne, ManyToOne} from "typeorm";
import { Club } from "./Club";
import { Lobby } from "./Lobby";
import { User_Profile } from "./User_Profile";

//enum
export type ClubMemberRequest = "Pending"| "Approved"| "Rejected";

//to create tables
// @Entity({ name: "Members", synchronize: true})
@Entity({ name: "Members"})
export class Members {

    @PrimaryGeneratedColumn()
    Member_Id: number;

    @ManyToOne(type => Club, club => club.Member_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    Club_Id: Club

    @ManyToOne(type => User_Profile, clubmember => clubmember.User_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    Club_Member_Id: User_Profile;

    @Column({type: "enum", enum: ["Pending", "Approved", "Rejected"], default: "Pending"})
    Club_Member_Request_Status: ClubMemberRequest;
}
