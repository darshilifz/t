import {Entity, PrimaryGeneratedColumn, Column, OneToMany, JoinColumn} from "typeorm";
import { Variation } from "./Variation";

//to create tables
// @Entity({ name: "Game", synchronize: true})
@Entity({ name: "Game"})
export class Game {

    @PrimaryGeneratedColumn()
    Game_Id: number;

    @Column({type: "varchar", unique: true })
    Game_Name: string;
    
    @Column("longblob")
    Game_Icon: string;

    @OneToMany(() => Variation, Game_Variation => Game_Variation.Game_Id)
    @JoinColumn()
    Variation_Id: Variation[];

}
