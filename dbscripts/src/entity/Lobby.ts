import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToOne} from "typeorm";
import { Club } from "./Club";
import { User_Profile } from "./User_Profile";
import { Variation } from "./Variation";

export enum VariationOp {
    ORG = "ORG",
    RM = "RM",
    RTD = "RTD",
    OTH = "OTH",
    ORG_500="ORG_500",
    RM_500="RM_500",
    RTD_500="RTD_500",
    ORG_1000="ORG_1000",
    RM_1000="RM_1000",
    RTD_1000="RTD_1000",
    ORG_5000="ORG_5000",
    RM_5000="RM_5000",
    RTD_5000="RTD_5000",
    ORG_25000="ORG_25000",
    RM_25000="RM_25000",
    RTD_25000="RTD_25000",
    ORG_50000="ORG_50000",
    RM_50000="RM_50000",
    RTD_50000="RTD_50000"
}

export enum LobbyStatusOp { Upcoming = "Upcoming", Live = "Live", Completed = "Completed"}

//to create tables
// @Entity({ name: "Lobby", synchronize: true})
@Entity({ name: "Lobby"})
export class Lobby {

    @PrimaryGeneratedColumn()
    Lobby_Id: number;

    @ManyToOne(() => Club, club => club.Lobby_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    Club_Id: Club;

    @ManyToOne(type => Variation, variation => variation.Variation_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    Variation_Id: Variation;

    @ManyToOne(type => User_Profile, owner => owner.User_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    Lobby_Owner_Id: User_Profile;

    @Column()
    Lobby_Commision_Rate: number;

    @Column({type: "varchar"})
    Lobby_Name: string;

    @Column({type: "enum", enum: ["ORG", "RM", "RTD", "OTH","ORG_500","RM_500","RTD_500","ORG_1000","RM_1000","RTD_1000","ORG_5000","RM_5000","RTD_5000","ORG_25000","RM_25000","RTD_25000","ORG_50000","RM_50000","RTD_50000"]
    , default: "ORG"})//include variation data as options
    Lobby_Type: VariationOp;

    @Column()
    Lobby_Blinds: number;

    @Column()
    Lobby_Total_Persons: number;

    @Column()
    Lobby_Join_Players: number;

    @Column({type: "bigint"})
    Lobby_Action_Time: number;//in seconds

    @Column("float")
    Lobby_Boot_Amount: number;

    @Column()
    Lobby_Auto_Start: boolean;

    @Column()
    Lobby_Min_Player_Limit: number;

    @Column()
    Lobby_Auto_Extension: boolean;

    @Column("time")
    Lobby_Time: string;

    @Column("float")
    Lobby_Pot_Limit: number;

    @Column("float")
    Lobby_Min_Bet: number;

    @Column("float")
    Lobby_Max_Bet: number;

    @Column({type: "varchar"})
    Room_Id: string;

    @Column({type: "enum", enum: ["Upcoming", "Live", "Completed"], default: "Upcoming"})
    Lobby_Status: LobbyStatusOp;

}
