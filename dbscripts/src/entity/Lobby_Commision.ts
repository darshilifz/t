import {Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn, ManyToOne} from "typeorm";
import { Lobby } from "./Lobby";
import { User_Profile } from "./User_Profile";

//to create tables
// @Entity({ name: "Lobby_Commision", synchronize: true})
@Entity({ name: "Lobby_Commision"})
export class Lobby_Commision {

    @PrimaryGeneratedColumn()
    Lobby_Commision_Id: number;

    @ManyToOne(type => Lobby, lobby => lobby.Lobby_Id, { onDelete: 'CASCADE' })
    @JoinColumn()
    Lobby_Id: Lobby;

    @Column()
    Lobby_Round: number;

    @Column("float")
    Total_Bet: number;

    @Column("float")
    Total_Commision_Amount: number;

}
