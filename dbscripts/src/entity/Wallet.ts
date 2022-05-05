import { type } from "os";
import {Entity, PrimaryGeneratedColumn, Column, JoinColumn, OneToOne} from "typeorm";
import { User_Profile } from "./User_Profile";

//to create tables
// @Entity({ name: "Wallet", synchronize: true})
@Entity({ name: "Wallet"})
export class Wallet {

    @PrimaryGeneratedColumn()
    Wallet_Id: string;

    @OneToOne(type => User_Profile, user => user.User_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    User_Id: User_Profile;
    
    @Column("float")
    User_Bouns_cash: number;

    @Column("float")
    User_Chips: number;

    @Column("float")
    User_Credit_Amount: number;

    @Column("float")
    User_Debit_Amount: number;

    @Column("float")
    User_Win_Amount: number;

    @Column("float")
    User_Loss_Amount: number;
}
