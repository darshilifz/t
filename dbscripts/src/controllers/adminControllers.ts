import { DbUtils } from "../utils/DbUtils";
import { InternalServerError, Unauthorized } from '../errors/InstancesCE'
import { User_Profile } from "../entity/User_Profile";
import { Lobby } from "../entity/Lobby";
import { Admin } from "../entity/Admin";
import { Variation } from "../entity/Variation";


import { Lobby_History } from "../entity/Lobby_History";
import { Payment } from "../entity/Payment";

import * as jwt from "jsonwebtoken";
import config from "../config/config";
import { Wallet } from "../entity/Wallet";
import { Club } from "../entity/Club";
import { Game } from "../entity/Game";
import { Lobby_Commision } from "../entity/Lobby_Commision";
var Passwordhash = require('password-hash');
const generate = require('nanoid/generate');


async function reGenerateToken(req, res, next) {
    console.log("POST /admin/regenerate/token1 API call made");
    // const token = req.body.token;
    // const username = req.body.username;
    // const userid = req.body.user_id;
    const { token, Admin_Name, Admin_Id, Admin_Roles } = req.body;

    jwt.verify(token, config.jwtSecret, async (error, decoded) => {
        if (error) {
            return res.status(404).json({
                message: error,
                error
            });
        } else {
            if (decoded.username == Admin_Name) {
                const token = jwt.sign(
                    { userId: Admin_Id, username: Admin_Name, role: Admin_Roles },
                    config.jwtSecret,
                    { expiresIn: "1h" }
                );
                console.log("token:", token);
                res.status(200).json([{
                    "Admin_Id": Admin_Id,
                    "Admin_Name": Admin_Name,
                    "Admin_Roles": Admin_Roles,
                    "token": token
                }])
            }
        }
    });
}

async function adminRegister(req, res, next) {
    console.log('POST /api/admin/user/register API call made');

    const { user_name, user_displayname, user_password, user_country, user_mob_no, user_email_id, user_image } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        if (await connection.manager.findOne(User_Profile, { where: { User_Name: user_name } })) {
            return res.status(409).json({ message: 'The Username has been taken, please try another' });
        }
        else if (await connection.manager.findOne(User_Profile, { where: { User_Mobile_Number: user_mob_no } })) {
            return res.status(409).json({ message: 'The Mobile number has been taken, please try another' });
        }
        else if (await connection.manager.findOne(User_Profile, { where: { User_Email_Id: user_email_id } })) {
            return res.status(409).json({ message: 'The Email Id has been taken, please try another' });
        }

        let user = new User_Profile();
        let wallet = new Wallet();
        wallet.User_Chips = 0;
        wallet.User_Bouns_cash = 0;
        wallet.User_Credit_Amount = 0;
        wallet.User_Debit_Amount = 0;
        wallet.User_Win_Amount = 0;
        wallet.User_Loss_Amount = 0;
        await connection.manager.save(wallet);

        user.User_Id = wallet.Wallet_Id;
        user.User_Name = user_name;
        user.User_DisplayName = user_displayname;
        user.User_Password = Passwordhash.generate(user_password); //to convert password in hash 
        user.User_Country = user_country;
        user.User_Mobile_Number = user_mob_no;
        user.User_Email_Id = user_email_id;
        user.User_Image = user_image;
        user.User_Level = 1;
        user.Wallet_Id = wallet;
        await connection.manager.save(user);
        wallet.User_Id = user;
        await connection.manager.save(wallet);

        res.status(200).json({ message: 'User Registered successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function getAlluserDetails(req, res, next) {
    console.log('GET /api/admin/users API call made');

    try {
        const connection = await DbUtils.getConnection();
        let data = await connection.getRepository(User_Profile).createQueryBuilder()
            .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"Username"',
                'user.User_DisplayName"User_DisplayName"', 'user.User_Country"User_Country"',
                'user.User_Mobile_Number"User_Mobile_Number"', 'user.User_Email_Id"User_Email_Id"', 'w.User_Chips"User_Chips"',
                'w.User_Win_Amount"User_Win_Amount"', 'w.User_Loss_Amount"User_Loss_Amount"'])
            .from(User_Profile, 'user')
            .innerJoin('user.Wallet_Id', 'w')
            //.take(10).skip(0)
            .getRawMany();

        console.log("length: ", data.length);
        if (data.length > 0) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}

async function getUserByUsername(req, res, next) {
    console.log('POST /api/admin/user API call made');
    const { user_name } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        let data1 = await connection.getRepository(User_Profile).createQueryBuilder()
            .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"Username"',
                'user.User_DisplayName"User_DisplayName"', 'user.User_Country"User_Country"',
                'user.User_Mobile_Number"User_Mobile_Number"', 'user.User_Email_Id"User_Email_Id"',
                'w.User_Chips"User_Chips"', 'w.User_Win_Amount"User_Win_Amount"', 'w.User_Loss_Amount"User_Loss_Amount"'])
            .from(User_Profile, 'user')
            .innerJoin('user.Wallet_Id', 'w')
            .where("user.User_Name = :name", { name: user_name })
            .getRawOne();

        let data = [];
        data.push(data1);

        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}

async function deleteuserDetailsFromUserId(req, res, next) {
    console.log('DELETE /api/admin/user API call made');
    const { user_id } = req.body;
    
                try {
                    const connection = await DbUtils.getConnection();
                    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id  } });
                    if(!exists) {
                        return res.status(409).json({ message: 'User is not exist'});
                    }
                    //delete wallet data
                    await connection.getRepository(Wallet).createQueryBuilder()
                    .delete()
                    .where("Wallet.Wallet_Id = :id", { id: user_id  })
                    .execute();
            
                    //delete user data
                    let data = await connection.getRepository(User_Profile).createQueryBuilder()
                    .delete("")
                    .where("User_Profile.User_Id = :id", { id: user_id  })
                    .execute();
                    
                    // console.log("delete User: ", data);
                    res.status(200).json({ message: 'User deleted successfully' });   
                } catch (error) {
                    console.log(error);
                    res.status(500).json({ message: 'Internal Server Error' });
                }
         
}

async function getAllGames(req, res, next) {
    console.log('GET /api/admin/games API call made');

    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Game)
            .createQueryBuilder()
            .select(['DISTINCT gm.Game_Id"Game_Id"', 'gm.Game_Name"Game_Name"'])
            .from(Game, 'gm')
            .getRawMany();

        console.log("all users:", data.length);
        if (data.length > 0) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}

async function getGameByGameName(req, res, next) {
    console.log('POST /api/admin/games API call made');
    const { game_name } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const data1 = await connection.getRepository(Game).createQueryBuilder()
            .select(['DISTINCT gm.Game_Id"Game_Id"', 'gm.Game_Name"Game Name"'])
            .from(Game, 'gm')
            .where("gm.Game_Name = :name", { name: game_name })
            .getRawOne();

        let data = [];
        data.push(data1);

        if (data) {
            return res.status(200).json({ data });
        }

        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getVariationByGameName(req, res, next) {
    console.log('GET /api/admin/variation/game API call made');
    const { game_name } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const game = await connection.manager.findOne(Game, { where: { Game_Name: game_name } });

        // console.log("game:" , game);
        const data1 = await connection.manager.findOne(Variation, { where: { Game_Id: game } });
        // console.log("game:" , data);
        if (data1) {
            let data = [];
            data.push(data1);
            return res.status(200).json({ data });
        }

        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function createClub(req, res, next) {
    console.log('POST /api/admin/club API call made');

    const { club_name, club_initial, club_logo, club_money, club_notice, club_owner_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        if (await connection.manager.findOne(Club, { where: { Club_Name: club_name } })) {
            return res.status(409).json({ message: 'The Club Name has been taken, please try another' });
        }

        let club = new Club();
        club.Club_Name = club_name;
        club.Club_Initial = club_initial;
        club.Club_Logo = club_logo;
        club.Club_Money = club_money;
        club.Club_Notice = club_notice;
        club.Club_owner_Id = await connection.manager.findOne(User_Profile, { where: { User_Id: club_owner_id } });
        await connection.manager.save(club);

        res.status(200).json({ message: 'Club Added successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getAllClub(req, res, next) {
    console.log('GET /api/admin/clubs API call made');

    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Club).createQueryBuilder()
            .select(['DISTINCT clb.Club_Id"Club_Id"', 'clb.Club_Name"Clubname"',
                'clb.Club_Initial"Club_Initial"', 'clb.Club_Money"Club_Money"',
                'owner.User_Name"Owner_Name"'])
            .from(Club, 'clb')
            .innerJoin('clb.Club_owner_Id', 'owner')
            .getRawMany();

        console.log("all users:", data.length);
        console.log("all users data:", data);

        if (data.length > 0) {
            // console.log("users data....");
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getClubByClubName(req, res, next) {
    console.log('GET /api/admin/club API call made');
    const { club_name } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.manager.findOne(Club, { where: { Club_Name: club_name } });

        if (data) {
            return res.status(200).json({ data });
        }

        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function updateClubWithClubId(req, res, next) {
    console.log('PUT /api/admin/club API call made');

    const { club_id, club_name, club_initial, club_logo, club_money, club_notice, club_owner_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const exists = await connection.manager.findOne(Club, { where: { Club_Id: club_id } });
        if (!exists) {
            return res.status(409).json({ message: 'Club is not exist, please try another' });
        }

        const data = await connection.getRepository(Club)
            .createQueryBuilder()
            .update(Club)
            .set({
                Club_Name: club_name,
                Club_Initial: club_initial,
                Club_Logo: club_logo,
                Club_Money: club_money,
                Club_Notice: club_notice,
                Club_owner_Id: club_owner_id
            })
            .where("Club_Id = :id", { id: club_id })
            .execute();

        res.status(200).json({ message: 'Data updated successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}

async function removeClubWithLobbies(req, res, next) {
    console.log('DELETE /api/admin/club API call made');
    const { club_id } = req.body;


    try {
        const connection = await DbUtils.getConnection();
        let exists = await connection.manager.findAndCount(Lobby, { where: { Lobby_Id: club_id } });
        if (!exists) {
            return res.status(409).json({ message: 'Lobby is not exist' });
        }
        console.log("delete Data1: ", exists);
        let data = await connection.getRepository(Lobby).createQueryBuilder()
            .delete()
            .from(Lobby)
            .where("Club_Id.Club_Id = :id", { id: club_id })
            .execute();

        // await connection.getRepository().remove(exists);
        exists = await connection.manager.findOne(Club, { where: { Club_Id: club_id } });
        if (!exists) {
            return res.status(409).json({ message: 'Club is not exist' });
        }
        console.log("delete Data2: ", exists);
        data = await connection.getRepository(Club).createQueryBuilder()
            .delete()
            .from(Club)
            .where("Club_Id = :id", { id: club_id })
            .execute();

        // await connection.getRepository().remove(exists);
        console.log("check delete Data: ", exists);
        res.status(200).json({ message: 'Club deleted successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function createLobby(req, res, next) {
    console.log('POST /api/admin/lobby API call made');

    const { club_id, variation_id, lobby_owner_id, lobby_commision_rate, lobby_name, lobby_type, lobby_blinds, lobby_total_persons, lobby_join_players, lobby_action_time, lobby_boot_amount, lobby_auto_start, lobby_min_player_limit, lobby_auto_extension, lobby_time, lobby_pot_limit, lobby_min_bet, lobby_max_bet, lobby_status, room_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        if (await connection.manager.findOne(Lobby, { where: { Lobby_Name: lobby_name } })) {
            return res.status(409).json({ message: 'The Lobby Name has been taken, please try another' });
        }

        let lobby = new Lobby();
        lobby.Club_Id = await connection.manager.findOne(Club, { where: { Club_Id: club_id } });
        lobby.Variation_Id = await connection.manager.findOne(Variation, { where: { Variation_Id: variation_id } });
        lobby.Lobby_Owner_Id = await connection.manager.findOne(User_Profile, { where: { User_Id: lobby_owner_id } });
        lobby.Lobby_Commision_Rate = lobby_commision_rate;
        lobby.Lobby_Name = lobby_name;
        lobby.Lobby_Type = lobby_type;
        lobby.Lobby_Blinds = lobby_blinds;
        lobby.Lobby_Total_Persons = lobby_total_persons;
        lobby.Lobby_Join_Players = lobby_join_players;
        lobby.Lobby_Action_Time = lobby_action_time;
        lobby.Lobby_Boot_Amount = lobby_boot_amount;
        lobby.Lobby_Auto_Start = lobby_auto_start;
        lobby.Lobby_Min_Player_Limit = lobby_min_player_limit;
        lobby.Lobby_Auto_Extension = lobby_auto_extension;
        lobby.Lobby_Time = lobby_time;
        lobby.Lobby_Pot_Limit = lobby_pot_limit;
        lobby.Lobby_Min_Bet = lobby_min_bet;
        lobby.Lobby_Max_Bet = lobby_max_bet;
        lobby.Room_Id = room_id;
        lobby.Lobby_Status = lobby_status;

        await connection.manager.save(lobby);

        res.status(200).json({ message: 'Lobby Added successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getAllLobies(req, res, next) {
    console.log('GET /api/admin/lobbies API call made');

    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Lobby).createQueryBuilder()
            .select(['DISTINCT lb.Lobby_Id"Lobby_Id"', 'club.Club_Name"Club_Name"',
                'var.Variation_Initial"Variation"', 'owner.User_Name"Owner_Name"',
                'lb.Lobby_Commision_Rate"Lobby_Commision_Rate"', 'lb.Lobby_Name"Lobby_Name"',
                'lb.Lobby_Blinds"Lobby_Blinds"', 'lb.Lobby_Total_Persons"Lobby_Total_Persons"',
                'lb.Lobby_Join_Players"Lobby_Join_Players"', 'lb.Lobby_Boot_Amount"Lobby_Boot_Amount"',
                'lb.Lobby_Min_Player_Limit"Lobby_Min_Player_Limit"', 'lb.Lobby_Time"Lobby_Time"',
                'lb.Lobby_Pot_Limit"Lobby_Pot_Limit"', 'lb.Lobby_Min_Bet"Lobby_Min_Bet"',
                'lb.Lobby_Max_Bet"Lobby_Max_Bet"', 'lb.Lobby_Status"Lobby_Status"',
                'lb.Lobby_Action_Time"Lobby_Action_Time"', 'lb.Lobby_Auto_Start"Lobby_Auto_Start"',
                'lb.Lobby_Auto_Extension"Lobby_Auto_Extension"'])
            .from(Lobby, 'lb')
            .innerJoin('lb.Club_Id', 'club')
            .innerJoin('lb.Variation_Id', 'var')
            .innerJoin('lb.Lobby_Owner_Id', 'owner')
            .getRawMany();

        console.log("all users:", data.length);
        console.log("all users:", data.length);
        if (data.length > 0) {
            // console.log("users data....");
            return res.status(200).json(data);
        }
        return res.status(400).json({ message: 'data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getLobbyFromClubId(req, res, next) {
    console.log('POST /api/admin/lobby API call made');
    const { club_id } = req.body;


    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Lobby).createQueryBuilder()
            .select(['DISTINCT lb.Lobby_Id"Lobby_Id"', 'club.Club_Name"Club_Name"',
                'var.Variation_Initial"Variation"', 'owner.User_Name"Owner_Name"',
                'lb.Lobby_Commision_Rate"Lobby_Commision_Rate"', 'lb.Lobby_Name"Lobby_Name"',
                'lb.Lobby_Blinds"Lobby_Blinds"', 'lb.Lobby_Total_Persons"Lobby_Total_Persons"',
                'lb.Lobby_Join_Players"Lobby_Join_Players"', 'lb.Lobby_Boot_Amount"Lobby_Boot_Amount"',
                'lb.Lobby_Min_Player_Limit"Lobby_Min_Player_Limit"', 'lb.Lobby_Time"Lobby_Time"',
                'lb.Lobby_Pot_Limit"Lobby_Pot_Limit"', 'lb.Lobby_Min_Bet"Lobby_Min_Bet"',
                'lb.Lobby_Max_Bet"Lobby_Max_Bet"', 'lb.Lobby_Status"Lobby_Status"',
                'lb.Lobby_Action_Time"Lobby_Action_Time"', 'lb.Lobby_Auto_Start"Lobby_Auto_Start"',
                'lb.Lobby_Auto_Extension"Lobby_Auto_Extension"'])
            .from(Lobby, 'lb')
            .innerJoin('lb.Club_Id', 'club')
            .innerJoin('lb.Variation_Id', 'var')
            .innerJoin('lb.Lobby_Owner_Id', 'owner')
            .where("lb.Club_Id = :id", { id: club_id })
            .getRawMany();

        // let data =[];
        // data.push(data1);

        if (data) {

            return res.status(200).json({ data });
        }

        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getOpenLFromCludId(req, res, next) {
    console.log('GET /api/admin/openlobbies API call made');


    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Lobby).createQueryBuilder()
            .select(['DISTINCT lb.Lobby_Id"Lobby_Id"', 'var.Variation_Initial"Variation"',
                'lb.Lobby_Commision_Rate"Lobby_Commision_Rate"', 'lb.Lobby_Name"Lobby_Name"',
                'lb.Lobby_Blinds"Lobby_Blinds"', 'lb.Lobby_Total_Persons"Lobby_Total_Persons"',
                'lb.Lobby_Join_Players"Lobby_Join_Players"', 'lb.Lobby_Boot_Amount"Lobby_Boot_Amount"',
                'lb.Lobby_Min_Player_Limit"Lobby_Min_Player_Limit"', 'lb.Lobby_Time"Lobby_Time"',
                'lb.Lobby_Pot_Limit"Lobby_Pot_Limit"', 'lb.Lobby_Min_Bet"Lobby_Min_Bet"',
                'lb.Lobby_Max_Bet"Lobby_Max_Bet"', 'lb.Lobby_Status"Lobby_Status"',
                'lb.Lobby_Action_Time"Lobby_Action_Time"', 'lb.Lobby_Auto_Start"Lobby_Auto_Start"',
                'lb.Lobby_Auto_Extension"Lobby_Auto_Extension"'])
            .from(Lobby, 'lb')
            .innerJoin('lb.Variation_Id', 'var')
            .where("lb.Club_Id IS NULL")
            .getRawMany();


        if (data) {

            return res.status(200).json({ data });
        }

        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function updateLobbyFromLobbyId(req, res, next) {
    console.log('PUT /api/admin/lobby API call made');
    const { lobby_id, lobby_name, lobby_commision_rate, lobby_blinds, lobby_total_persons, lobby_action_time, lobby_boot_amount, lobby_auto_start, lobby_min_player_limit, lobby_auto_extension, lobby_time, lobby_pot_limit, lobby_min_bet, lobby_max_bet, lobby_status } = req.body;


    try {
        const connection = await DbUtils.getConnection();
        const exists = await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby_id } });
        if (!exists) {
            return res.status(409).json({ message: 'Lobby is not exist, please try another' });
        }

        const data = await connection.getRepository(Lobby)
            .createQueryBuilder()
            .update(Lobby)
            .set({
                Lobby_Name: lobby_name,
                Lobby_Commision_Rate: lobby_commision_rate,
                Lobby_Blinds: lobby_blinds,
                Lobby_Total_Persons: lobby_total_persons,
                Lobby_Action_Time: lobby_action_time,
                Lobby_Boot_Amount: lobby_boot_amount,
                Lobby_Auto_Start: lobby_auto_start,
                Lobby_Min_Player_Limit: lobby_min_player_limit,
                Lobby_Auto_Extension: lobby_auto_extension,
                Lobby_Time: lobby_time,
                Lobby_Pot_Limit: lobby_pot_limit,
                Lobby_Min_Bet: lobby_min_bet,
                Lobby_Max_Bet: lobby_max_bet,
                Lobby_Status: lobby_status
            })
            .where("Lobby_Id = :id", { id: lobby_id })
            .execute();

        res.status(200).json({ message: 'Data updated successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }


}
async function lobbyHistoryFromLobbyId(req, res, next) {
    console.log('POST /api/admin/lobby_history API call made');
    const { lobby_id } = req.body;


    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Lobby_History).createQueryBuilder()
            .select(['DISTINCT lbh.Lobby_History_Id"Lobby_History_Id"', 'lb.Lobby_Name"Lobby_Name"',
                'user.User_Name"User_Name"',
                'lbh.User_Win_Status"User_Win_Status"', 'lbh.Amount"Amount"',
                'lbh.Round_Status"Round_Status"',
                'lbh.Lobby_Round"Lobby_Round"', 'lbh.Total_Bet"Total_Bet"'])
            .from(Lobby_History, 'lbh')
            .innerJoin('lbh.Lobby_Id', 'lb')
            .innerJoin('lbh.User_Id', 'user')
            .where("lbh.Lobby_Id.Lobby_Id = :id", { id: lobby_id })
            .getRawMany();

        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getLeisureFromLobbyId(req, res, next) {
    console.log('GET /api/admin/leisure API call made');


    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Lobby_History).createQueryBuilder()
            .select(['DISTINCT lb.Lobby_Id"Lobby_Id"', 'lb.Lobby_Name"Lobby_Name"',
                'lbh.Lobby_Round"Lobby_Round"', 'user.User_Name"User_Name"',
                'lbh.User_Win_Status"User_Win_Status"', 'lbh.Amount"Amount"'])
            .from(Lobby_History, 'lbh')
            .innerJoin('lbh.Lobby_Id', 'lb')
            .innerJoin('lbh.User_Id', 'user')
            .orderBy('lb.Lobby_Id', 'DESC')
            .orderBy('lbh.Lobby_Round', 'DESC')
            .where("lbh.User_Win_Status = :id", { id: 1 })
            .getRawMany();

        console.log("data length:" + data.length);

        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function leisurePlayerFromLobbyId(req, res, next) {
    console.log('POST /api/admin/leisureplayer API call made');
    const { lobby_id, lobby_round } = req.body;


    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.getRepository(Lobby_History).createQueryBuilder()
            .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"User_Name"',
                'lbh.User_Win_Status"User_Win_Status"', 'lbh.Amount"Amount"'])
            .from(Lobby_History, 'lbh')
            .innerJoin('lbh.Lobby_Id', 'lb')
            .innerJoin('lbh.User_Id', 'user')
            .orderBy('lbh.User_Win_Status', 'DESC')
            .where("lbh.Lobby_Id.Lobby_Id = :id", { id: lobby_id })
            .andWhere("lbh.Lobby_Round = :round", { round: lobby_round })
            .getRawMany();

        console.log("data length:" + data.length);

        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function adminLogin(req, res, next) {
    console.log('GET /api/admin/login API call made');

    const { admin_name, admin_password } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const loginuser = await connection.manager.findOne(Admin, { where: { Admin_Name: admin_name } });
        if (loginuser && (Passwordhash.verify(admin_password, loginuser.Admin_Password))) {
            console.log("login");

            const token = jwt.sign(
                { userId: loginuser.id, username: admin_name },
                config.jwtSecret,
                { expiresIn: "1h" }
            );
            loginuser.token = token;
            let data = [loginuser];
            return res.status(200).json({ data });
            // return res.setHeader('Authorization', `Bearer ${token}`).status(200).json({ message: 'User login successfully' });
        }
        return res.status(200).json({ message: 'Incorrect Adminname or Password' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function adminCreateAdmin(req, res, next) {
    console.log('POST /api/admin/createadmin API call made');
    const { admin_name, admin_role, admin_password,admin_upi_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        if (await connection.manager.findOne(Admin, { where: { Admin_Name: admin_name } })) {
            return res.status(409).json({ message: 'The Admin Name has been taken, please try another' });
        }

        let admin = new Admin();
        admin.Admin_Name = admin_name;
        admin.Admin_Roles = admin_role;
        admin.Admin_UPI_Id=admin_upi_id;
        admin.Admin_Password = Passwordhash.generate(admin_password);
        await connection.manager.save(admin);

        return res.status(200).json({ message: 'Admin added successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function getAllAdmins(req, res, next) {
    console.log('GET /api/admin/admins API call made');

    try {
        const connection = await DbUtils.getConnection();
        const data = await connection.manager.find(Admin);
        console.log("all users:", data);
        if (data.length > 0) {
            // console.log("users data....");
            //const users = await connection.manager.find(User_Profile);
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function getAdminFromAdminName(req, res, next) {
    console.log('POST /api/admin/admins API call made');
    const { admin_name } = req.body;


    try {
        const connection = await DbUtils.getConnection();
        const data1 = await connection.manager.findOne(Admin, { where: { Admin_Name: admin_name } });

        let data = [];
        data.push(data1);

        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function updateAdminFromAdminId(req, res, next) {
    console.log('PUT /api/admin/admin API call made');

    const { admin_id, admin_name, admin_role, admin_password,admin_upi_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const exists = await connection.manager.findOne(Admin, { where: { Admin_Id: admin_id } });
        if (!exists) {
            return res.status(409).json({ message: 'Admin is not exist, please try another' });
        }

        const data = await connection.getRepository(Admin)
            .createQueryBuilder()
            .update(Admin)
            .set({
                Admin_Name: admin_name,
                Admin_Roles: admin_role,
                Admin_UPI_Id:admin_upi_id,
                Admin_Password: Passwordhash.generate(admin_password)
            })
            .where("Admin_Id = :id", { id: admin_id })
            .execute();

        res.status(200).json({ message: 'Data updated successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }


}
async function deleteAdminWithAdminId(req, res, next) {
    console.log('DELETE /api/admin/admin API call made');
    const { admin_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        let exists = await connection.manager.findOne(Admin, { where: { Admin_Id: admin_id } });
        if (!exists) {
            return res.status(409).json({ message: 'Admin is not exist' });
        }
        console.log("delete Data1: ", exists);
        let data = await connection.getRepository(Admin).createQueryBuilder()
            .delete()
            .from(Admin)
            .where("Admin_Id = :id", { id: admin_id })
            .execute();

        // await connection.getRepository().remove(exists);
        console.log("check delete Data: ", exists);
        res.status(200).json({ message: 'Admin deleted successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function createPayment(req, res, next) {
    console.log('POST /api/admin/payment API call made');

    const { user_id, isdebitcredit, payment_amount } = req.body;

    try {
        const connection = await DbUtils.getConnection();

        let payment = new Payment();
        payment.User_Id = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
        console.log("debit:", isdebitcredit);
        if (isdebitcredit == "true") {
            payment.Is_DebitCredit = true;
        }
        else {
            payment.Is_DebitCredit = false;
        }
        console.log("payment debit:", payment.Is_DebitCredit);
        payment.Payment_Amount = payment_amount;
        await connection.manager.save(payment);

        console.log("wallet:", payment.User_Id.User_Id);
        let chips;
        let wallet = await connection.manager.findOne(Wallet, { where: { User_Id: payment.User_Id.User_Id } });
        console.log("data:", wallet);
        if (payment.Is_DebitCredit) {
            chips = parseFloat(wallet.User_Chips) + parseFloat(payment_amount);
            console.log("chips:", chips);
        }
        else {
            if (parseFloat(wallet.User_Chips) >= parseFloat(payment_amount)) {
                chips = parseFloat(wallet.User_Chips) - parseFloat(payment_amount);
                console.log("chips:", chips);
            }
            else {
                console.log("Unsufficient balance");
                res.status(200).json({ message: 'Unsufficient balance' });
            }

        }
        wallet.User_Chips = chips;
        await connection.manager.save(wallet);

        res.status(200).json({ message: 'Payment Created successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getAllPayments(req, res, next) {
    console.log('GET /api/admin/payment API call made');

    try {
        const connection = await DbUtils.getConnection();
        let data = await connection.getRepository(Payment).createQueryBuilder()
            .select(['DISTINCT pm.Payment_Id"Payment_Id"', 'pm.Is_DebitCredit"Is_DebitCredit"',
                'user.User_Id"User_Id"', 'user.User_Name"User_Name"', 'pm.Payment_Amount"Payment_Amount"',
                'pm.Payment_Time_Date"Payment_Time_Date"'])
            .from(Payment, 'pm')
            .innerJoin('pm.User_Id', 'user')
            // .where("lb.Lobby_Id = :id", { id: lobby_id })
            .getRawMany();

        console.log("all users:", data.length);
        if (data.length > 0) {
            // console.log("users data....");
            //const users = await connection.manager.find(User_Profile);
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}

async function getPaymentFromUserId(req, res, next) {
    console.log('POST /api/admin/payment API call made');
    const { user_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        let data = await connection.getRepository(Payment).createQueryBuilder()
            .select(['DISTINCT pm.Payment_Id"Payment_Id"', 'pm.Is_DebitCredit"Is_DebitCredit"',
                'user.User_Id"User_Id"', 'user.User_Name"User_Name"', 'pm.Payment_Amount"Payment_Amount"',
                'pm.Payment_Time_Date"Payment_Time_Date"'])
            .from(Payment, 'pm')
            .innerJoin('pm.User_Id', 'user')
            .where("pm.User_Id = :id", { id: user_id })
            .getRawMany();

        if (data) {
            return res.status(200).json({ data });
        }


        return res.status(400).json({ message: 'Data does not exists' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function getAllUsersCommission(req, res, next) {
    console.log('GET /api/admin/commision API call made');

    try {
        const connection = await DbUtils.getConnection();
        let data = await connection.getRepository(User_Profile).createQueryBuilder()
            .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"Username"',
                'user.User_DisplayName"User_DisplayName"', 'w.User_Bouns_cash"User_Bouns_cash"'])
            .from(User_Profile, 'user')
            .innerJoin('user.Wallet_Id', 'w')
            //.take(10).skip(0)
            .where("w.User_Bouns_cash > :num", { num: 0 })
            .getRawMany();

        console.log("data", data.length);
        if (data.length > 0) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function commisionDetailsByUserName(req, res, next) {
    console.log('POST /api/admin/commision API call made');
    const { user_name } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        let data1 = await connection.getRepository(User_Profile).createQueryBuilder()
            .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"Username"',
                'user.User_DisplayName"User_DisplayName"', 'w.User_Bouns_cash"User_Bouns_cash"'])
            .from(User_Profile, 'user')
            .innerJoin('user.Wallet_Id', 'w')
            .where("user.User_Name = :name", { name: user_name })
            .andWhere("w.User_Bouns_cash > :num", { num: 0 })
            .getRawOne();

        let data = [];
        data.push(data1);

        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function adminCreateOurCommission(req, res, next) {
    console.log('POST /api/admin/createourcommision API call made');
    const { lobby_id, lobby_round, total_bet, total_commision_amount } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        if (!await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby_id } })) {
            return res.status(409).json({ message: 'The Lobby is not available' });
        }

        let lobby_commision = new Lobby_Commision();
        lobby_commision.Lobby_Id = await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby_id } });
        lobby_commision.Lobby_Round = lobby_round;
        lobby_commision.Total_Bet = total_bet;
        lobby_commision.Total_Commision_Amount = total_commision_amount;
        await connection.manager.save(lobby_commision);

        return res.status(200).json({ message: 'Lobby Commision added successfully' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function adminOurCommision(req, res, next) {
    console.log('GET /api/admin/ourcommision API call made');
    try {
        const connection = await DbUtils.getConnection();
        let data = await connection.getRepository(Lobby_Commision).createQueryBuilder()
            .select(['DISTINCT com.Lobby_Commision_Id"Lobby_Commision_Id"', 'l.Lobby_Name"Lobby_Name"',
                'com.Lobby_Round"Lobby_Round"', 'com.Total_Bet"Total_Bet"',
                'com.Total_Commision_Amount"Total_Commision_Amount"'])
            .from(Lobby_Commision, 'com')
            .innerJoin('com.Lobby_Id', 'l')
            // .where("com.Lobby_Id = :id", { id: "l.Lobby_Id"})
            .orderBy('com.Lobby_Commision_Id', 'DESC')
            //.limit(limitd)
            .getRawMany();

        // console.log("count: ", count);
        console.log("length: ", data.length);
        if (data.length > 0) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }

}
async function adminOurCommissionByUserName(req, res, next) {
    console.log('POST /api/admin/ourcommision API call made');
    const { lobby_name } = req.body;
    try {
        const connection = await DbUtils.getConnection();
        let data = await connection.getRepository(Lobby_Commision).createQueryBuilder()
            .select(['DISTINCT com.Lobby_Commision_Id"Lobby_Commision_Id"', 'l.Lobby_Name"Lobby_Name"',
                'com.Lobby_Round"Lobby_Round"', 'com.Total_Bet"Total_Bet"',
                'com.Total_Commision_Amount"Total_Commision_Amount"'])
            .from(Lobby_Commision, 'com')
            .innerJoin('com.Lobby_Id', 'l')
            .orderBy('com.Lobby_Commision_Id', 'DESC')
            .where("l.Lobby_Name = :name", { name: lobby_name })
            .getRawMany();


        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }


}

async function adminDashboard(req, res, next) {
    console.log('GET /api/admin/dashboard API call made');

    try {
        const connection = await DbUtils.getConnection();

        let [User, Usercount] = await connection.manager.findAndCount(User_Profile);
        let [game, Gamecount] = await connection.manager.findAndCount(Game);
        let [club, Clubcount] = await connection.manager.findAndCount(Club);
        let [payment, Paymentcount] = await connection.manager.findAndCount(Payment);
        let [admin, Admincount] = await connection.manager.findAndCount(Admin);
        let o = await connection.getRepository(Lobby).createQueryBuilder()
            .select(['DISTINCT lb.Lobby_Id"Lobby_Id"']).from(Lobby, 'lb').where("lb.Club_Id IS NULL").getRawMany();
        let oppenlobby = o.length;
        let [a, leisure] = await connection.manager.findAndCount(Lobby_History, { where: { User_Win_Status: 1 } });
        let commision = await connection.getRepository(User_Profile).createQueryBuilder()
            .select(['DISTINCT user.User_Id"User_Id"']).from(User_Profile, 'user').innerJoin('user.Wallet_Id', 'w')
            .where("w.User_Bouns_cash > :num", { num: 0 }).getRawMany();
        let commisioncount = commision.length;
        let [ourcommision, ourcommisioncount] = await connection.manager.findAndCount(Lobby_Commision);

        let data1 = {
            "User": Usercount, "Game": Gamecount, "Club": Clubcount, "Withdrawls": Paymentcount, "Admin": Admincount,
            "Commision": commisioncount, "OurCommision": ourcommisioncount, "OpenLobbies": oppenlobby, "leisure": leisure
        };

        let data = [];
        data.push(data1);

        console.log("length: ", data);
        if (data) {
            return res.status(200).json({ data });
        }
        return res.status(400).json({ message: 'Data not available' });
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

// async function paymentApprove(req,res,next){
//     console.log('PUT /api/admin/paymentApprove call');
//     const {payment_status,user_id}=req.body;
//     try{
//         const connection = await DbUtils.getConnection();
//         const paymentData = await connection.manager.findOne(PaymentPaytm, { where: { User_Id: user_id } });
//             if(!paymentData) {
//                     return res.status(409).json({ message: 'Data is not exists'});
//             }
//             const data = await connection.getRepository(PaymentPaytm)
//             .createQueryBuilder()
//             .update(PaymentPaytm)
//             .set({ 
//                 Payment_Status:payment_status
//             })
//             .where("User_Id = :id", { id:user_id })
//             .execute();
//             return res.status(200).json({ message: 'Data updated successfully' });  

//     }catch(error){
//         console.log(error);
//         throw new InternalServerError();
//     }
// }


export const adminController = { reGenerateToken, adminRegister, getAlluserDetails, getUserByUsername, getAllGames, getGameByGameName, getVariationByGameName, createClub, getAllClub, getClubByClubName, updateClubWithClubId, removeClubWithLobbies, createLobby, getAllLobies, getLobbyFromClubId, getOpenLFromCludId, updateLobbyFromLobbyId, lobbyHistoryFromLobbyId, getLeisureFromLobbyId, leisurePlayerFromLobbyId, adminLogin, adminCreateAdmin, getAllAdmins, getAdminFromAdminName, updateAdminFromAdminId, deleteAdminWithAdminId, createPayment, getAllPayments, getPaymentFromUserId, getAllUsersCommission, commisionDetailsByUserName, adminCreateOurCommission, adminOurCommision, adminOurCommissionByUserName, adminDashboard, deleteuserDetailsFromUserId }

