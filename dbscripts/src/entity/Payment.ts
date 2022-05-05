import {Entity, PrimaryGeneratedColumn, Column, Timestamp, ManyToOne, JoinColumn} from "typeorm";
import { User_Profile } from "./User_Profile";

//to create tables
// @Entity({ name: "Payment", synchronize: true})
@Entity({ name: "Payment"})
export class Payment {

    @PrimaryGeneratedColumn()
    Payment_Id: number;

    @ManyToOne(type => User_Profile, user => user.User_Id,{ onDelete: 'CASCADE' })
    @JoinColumn()
    User_Id: User_Profile;
    
    @Column()
    Is_DebitCredit: boolean; //yes = debit, no = credit

    @Column("float")
    Payment_Amount: number;

    @Column({type:"timestamp",  default: () => 'CURRENT_TIMESTAMP'})
    Payment_Time_Date: Timestamp;

      @Column("longblob")
      Payment_Image: string;

      @Column()
      Status: number; // 0-Success, 1-Failed, 2-Pending

      @Column("text")
      Remark: string;
}



