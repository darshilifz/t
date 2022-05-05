import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne} from "typeorm";
import { Lobby } from "./Lobby";
import { User_Profile } from "./User_Profile";

//to create tables
// @Entity({ name: "Lobby_History", synchronize: true})
@Entity({ name: "Lobby_History"})
export class Lobby_History {

    @PrimaryGeneratedColumn()
    Lobby_History_Id: number;

    @ManyToOne(type => Lobby, lobby => lobby.Lobby_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    Lobby_Id: Lobby;

    @ManyToOne(type => User_Profile, user => user.User_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    User_Id: User_Profile;

    //with boolean
    @Column()
    User_Win_Status: boolean; //yes = win, no = loss

    @Column("float")
    Amount: number;//winloss amount

    @Column()
    Round_Status: boolean; // yes = running, no = notrunning

    @Column()
    User_Status: boolean; // yes = playing, no = notplaying

    @Column()
    User_Seating: boolean; // yes = seat, no = notseat

    @Column()
    Lobby_Round: number;

    @Column("float")
    Total_Bet: number;

}
