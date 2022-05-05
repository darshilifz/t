import {Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn, JoinTable, OneToOne, ManyToOne} from "typeorm";
import { Lobby } from "./Lobby";
import { Members } from "./Members";
import { User_Profile } from "./User_Profile";

//to create tables
// @Entity({ name: "Club", synchronize: true})
@Entity({ name: "Club"})
export class Club {

    @PrimaryGeneratedColumn()
    Club_Id: number;

    @Column({type: "varchar", unique: true })
    Club_Name: string;

    @Column({length:3})
    Club_Initial: string;

    @Column("longblob")
    Club_Logo: string;

    @Column("bigint")
    Club_Money: number;

    @Column("text")
    Club_Notice: string;

    @ManyToOne(type => User_Profile, clubowner => clubowner.User_Id, { onDelete: 'CASCADE' })
    @JoinColumn()
    Club_owner_Id: User_Profile;

    @OneToMany(() => Lobby, lobby => lobby.Club_Id)
    @JoinColumn()
    Lobby_Id: Lobby[];

    @OneToMany(() => Members, member => member.Club_Id)
    @JoinColumn()
    Member_Id: Members[];

}
