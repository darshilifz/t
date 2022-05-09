import { type } from "os";
import {Entity, PrimaryColumn, Column, OneToOne, JoinColumn} from "typeorm";
import { Wallet } from "./Wallet";

//to create tables
// @Entity({ name: "User_Profile", synchronize: true})
@Entity({ name: "User_Profile"})
export class User_Profile {

    @PrimaryColumn()
    User_Id: string;

    @Column({type: "varchar", nullable: true})
    Fb_User_Id: string;

    @Column({type: "varchar"})
    User_Name: string;

    @Column()
    User_DisplayName: string;

    @Column("varchar")
    User_Password: string;

    @Column("text")
    User_Country: string;

    @Column({ type: "bigint", nullable: true })
    User_Mobile_Number: number;

    @Column({ type: "varchar", nullable: true })
    User_Email_Id: string;

    @Column("longblob")
    User_Image: string;

    @Column()
    User_Level: number;

    @Column({default:0})
    User_Balence:number;

      @Column({type:"varchar",nullable:true})
      User_UPI_Id: string;

    @OneToOne(type => Wallet, Wallet_Id => Wallet_Id.Wallet_Id, { onDelete:'CASCADE' })
    @JoinColumn()
    Wallet_Id: Wallet;
}
