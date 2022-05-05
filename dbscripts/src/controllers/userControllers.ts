import { DbUtils } from "../utils/DbUtils";
import { Lobby } from "../entity/Lobby";
import { InternalServerError, NotFoundError } from '../errors/InstancesCE'
import { Lobby_History } from "../entity/Lobby_History";
import { Auth } from "../entity/Auth";
import { Payment } from "../entity/Payment";
import { Variation } from "../entity/Variation";
import { Wallet } from "../entity/Wallet";
import { User_Profile } from "../entity/User_Profile";
import { Club } from "../entity/Club";
import { Members } from "../entity/Members";


const TokenGenerator = require('uuid-token-generator');
let tokenGenerator = new TokenGenerator();
var Passwordhash = require('password-hash');

const generate = require('nanoid/generate');




//=======================Registration & Login============================
async function userRegister(req, res, next){
    console.log('POST /api/user/register API call made');

    
    const { user_name, user_displayname, user_password, user_country, user_mob_no, user_email_id, user_image} = req.body;

    try {
        const connection = await DbUtils.getConnection();
        if(await connection.manager.findOne(User_Profile, { where: { User_Name : user_name } })) {
            return res.status(409).json({ message: 'The Username has been taken, please try another'});
        }
        else if(await connection.manager.findOne(User_Profile, { where: { User_Mobile_Number :  user_mob_no } })) {
            return res.status(409).json({ message: 'The Mobile number has been taken, please try another'});
        }
        else if(await connection.manager.findOne(User_Profile, { where: { User_Email_Id : user_email_id } })) {
            return res.status(409).json({ message: 'The Email Id has been taken, please try another'});
        }

        let user = new User_Profile();
        let wallet = new Wallet();
        let auth = new Auth();
        // wallet.User_Id = wallet.Wallet_Id;

        wallet.User_Chips = 0;
        wallet.User_Bouns_cash = 0;
        wallet.User_Credit_Amount = 0;
        wallet.User_Debit_Amount = 0;
        wallet.User_Win_Amount = 0;
        wallet.User_Loss_Amount = 0;
        await connection.manager.save(wallet);

        //  console.log("waller userid: ", wallet);
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
 console.log("waller userid: ", wallet);
        auth.User_Id = await connection.manager.findOne(User_Profile, { where: { User_Id : user.User_Id } });
        console.log("waller userid:", user);
        auth.Currently_Playing = false;
        auth.Jwt_Token = tokenGenerator.generate();
        await connection.manager.save(auth);
         console.log("Auth : ", auth);

        res.status(200).json({ message: 'User Registered successfully',user_id:user.User_Id });   
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}


async function verifyMobile(req, res, next) {
    console.log('POST /api/user/mobile API call made');

    const { user_mob_no } = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const verifyuser = await connection.manager.findOne(User_Profile, { where: { User_Mobile_Number : user_mob_no } });
        if(verifyuser) {
            // const token = jwt.sign(
            //         { userId: loginuser.id, username: user_name},
            //         config.jwtSecret,
            //         { expiresIn: "1h" }
            //       );
        //     return res/*.setHeader('Authorization', `Bearer ${token}`)*/.status(200).json({ message: 'User login successfully' });
        // }
        // return res.status(200).json({ message: 'Incorrect Username or Password' }); 
        return res.status(200).json({ Issuccessful: true , user_id : verifyuser.User_Id });
    }
    return res.status(200).json({ Issuccessful: false }); 
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}


async function userLogin(req, res, next) {
    console.log('POST /api/user/login API call made');

    const { user_name, user_password, device_id} = req.body;

    try {
        const connection = await DbUtils.getConnection();
        const loginuser = await connection.manager.findOne(User_Profile, { where: { User_Name : user_name } });
        if(loginuser && (Passwordhash.verify(user_password, loginuser.User_Password))) {
            const exists = await connection.manager.findOne(Auth, { where: { User_Id: loginuser.User_Id } });
            if(!exists) {
                return res.status(409).json({ message: 'User Token is not available'});
            }
            else if(exists.Currently_Playing && (exists.Device_Id != device_id))
            {
                return res.status(409).json({ message: 'This user is already login in other device'});
            }
            let tokengen =tokenGenerator.generate();
            const data = await connection.getRepository(Auth)
            .createQueryBuilder()
            .update(Auth)
            .set({ 
                Jwt_Token : tokengen,
                Currently_Playing : true
            })
            .where("User_Id = :id", { id: loginuser.User_Id })
            .execute();
            const temp = await connection.manager.findOne(Auth, { where: { User_Id: loginuser.User_Id } });
            return res.status(200).json({ Issuccessful: true , user_id : loginuser.User_Id, token : temp.Jwt_Token });
        }
        return res.status(200).json({ Issuccessful: false }); 
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function userlobbyentry(req, res, next) {
    console.log('PUT /api/user/logout API call made');
    const { user_id, playing } = req.body;
    
    try {
        const connection = await DbUtils.getConnection();
      
                const exists = await connection.manager.findOne(Auth, { where: { User_Id: user_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'User Token is not available'});
                }

                const data = await connection.getRepository(Auth)
                .createQueryBuilder()
                .update(Auth)
                .set({ 
                    Currently_Playing : playing
                })
                .where("User_Id = :id", { id: user_id })
                .execute();
                
                return res.status(200).json({ Issuccessful: true , user_id : user_id, token : data.Jwt_Token });
            
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    } 
}


async function userLogout(req, res, next) {
    console.log('PUT /api/user/logout API call made');
    const { user_id,playing } = req.body;
    
    try {
        const connection = await DbUtils.getConnection();
      
                const exists = await connection.manager.findOne(Auth, { where: { User_Id: user_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'User Token is not available'});
                }

                const data = await connection.getRepository(Auth)
                .createQueryBuilder()
                .update(Auth)
                .set({ 
                    Currently_Playing : playing,
                    Device_Id : null,
                    Token : null
                })
                .where("User_Id = :id", { id: user_id })
                .execute();
                
                return res.status(200).json({ Issuccessful: true , user_id : user_id, token : data.Jwt_Token });
            
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    } 
}




//=======================User Profile============================
async function updateProfile(req, res, next) {
    console.log('PUT /api/user/updateprofile API call made');

    const {user_id, user_displayname, user_country, user_image} = req.body;
    
    try {
        const connection = await DbUtils.getConnection();
        
                const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'User is not registered with us, please try another'});
                }

                const data = await connection.getRepository(User_Profile)
                .createQueryBuilder()
                .update(User_Profile)
                .set({ 
                    User_DisplayName : user_displayname,
                    User_Country : user_country,
                    User_Image : user_image
                })
                .where("User_Id = :id", { id: user_id })
                .execute();

                res.status(200).json({ message: 'User updated successfully' });   
            
    } catch (error) {
        console.log(error);
        throw new InternalServerError()

    }
}

async function changePassword(req, res, next) {
    console.log('PUT /api/user/changepassword API call made');

    const {user_id, user_password} = req.body;
   
                try {
                    const connection = await DbUtils.getConnection();
                    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
                    if(!exists) {
                        return res.status(409).json({ message: 'User is not registered with us, please try another'});
                    }
            
                    const data = await connection.getRepository(User_Profile)
                    .createQueryBuilder()
                    .update(User_Profile)
                    .set({ 
                        User_Password : Passwordhash.generate(user_password)//to convert password in hash 
                    })
                    .where("User_Id = :id", { id: user_id })
                    .execute();

            		console.log(data)
                    res.status(200).json({ message: 'User Password updated successfully' });   
                } catch (error) {
                    console.log(error);
                    throw new InternalServerError()
  
    }
}


async function userDetailByUserId(req, res, next) {
    console.log('POST /api/user/detail API call made');
    const { user_id } = req.body;
        
        try {
            const connection = await DbUtils.getConnection();
           
                    let data = await connection.getRepository(User_Profile).createQueryBuilder()
                    .select(['user.User_Id"User_Id"', 'user.User_Name"Username"',
                    'user.User_DisplayName"User_DisplayName"', 'user.User_Country"User_Country"',
                    'user.User_Image"User_Image"','user.User_Level"User_Level"', 'w.User_Chips"User_Chips"'])
                    .from(User_Profile, 'user')
                    .innerJoin('user.Wallet_Id', 'w')
                    .where("user.User_Id = :id", { id: user_id})
                    .getRawOne();
    
                    //console.log("all users:", data[0].User_Image.toString());
                    
                    if (data) {
                        return res.status(200).json(data);
                    }
                    return res.status(400).json({ message: 'Data not available' });   
              
        } catch (error) {
            console.log(error);
            throw new InternalServerError()
        }
}


async function createClub(req, res, next) {
    console.log('POST /api/club API call made');

    const {club_name, club_initial, club_logo, club_notice, club_owner_id} = req.body;
    try {
        const connection = await DbUtils.getConnection();
    
                if(await connection.manager.findOne(Club, { where: { Club_Name : club_name } })) {
                    return res.status(409).json({ message: 'The Club Name has been taken, please try another'});
                }
        
                let club = new Club();
                club.Club_Name = club_name;
                club.Club_Initial = club_initial;
                club.Club_Logo = club_logo;
                club.Club_Money = 0;
                club.Club_Notice = club_notice;
                club.Club_owner_Id = await connection.manager.findOne(User_Profile, { where: { User_Id : club_owner_id } });
                await connection.manager.save(club);
        
                res.status(200).json({ message: 'Club Added successfully' });  
           
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function getClubFromClubId(req, res, next) {
    console.log('GET /api/clubdata API call made');
    const { club_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
      
                if(!await connection.manager.findOne(Club, { where: { Club_Id : club_id } })) {
                    return res.status(409).json({ message: 'Club is not available'});
                }

                // console.log("game:" , game);
                const data = await connection.getRepository(Club).createQueryBuilder()
                .select(['DISTINCT cb.Club_Id"Club_Id"', 'cb.Club_Name"ClubName"',
                'cb.Club_Initial"Club_Initial"', 'cb.Club_Logo"Club_Logo"',
                'cb.Club_Money"Club_Money"', 'cb.Club_Notice"Club_Notice"',
                'ow.User_Id "ClubOwner_id"'])
                .from(Club, 'cb')
                .innerJoin('cb.Club_owner_Id', 'ow')
                .where("cb.Club_Id = :id", { id: club_id})
                .getRawOne();
                // console.log("game:" , data);
                if(data) {
                
                    return res.status(200).json({data:JSON.stringify(data)});
                }

                throw new NotFoundError("Data Does not exists"); 
         
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function updateClubWithClubId(req, res, next) {
    console.log('PUT /api/club API call made');

    const { club_id, club_name, club_initial, club_logo, club_notice, club_owner_id} = req.body;
    try {
        const connection = await DbUtils.getConnection();
                const exists = await connection.manager.findOne(Club, { where: { Club_Id: club_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'Club is not exist, please try another'});
                }

                const data = await connection.getRepository(Club)
                .createQueryBuilder()
                .update(Club)
                .set({ 
                    Club_Name: club_name,
                    Club_Initial: club_initial,
                    Club_Logo: club_logo,
                    Club_Money: 0,
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
async function removeClubAndDetails(req, res, next) {
    console.log('DELETE /api/club API call made');
    const { club_id } = req.body;

    try {
        const connection = await DbUtils.getConnection();
                let exists = await connection.manager.findOne(Club, { where: { Club_Id: club_id  } });
                if(!exists) {
                    return res.status(409).json({ message: 'Club is not exist'});
                }
                console.log("delete Data2: ", exists);
                let data = await connection.getRepository(Club).createQueryBuilder()
                .delete()
                .from(Club)
                .where("Club_Id = :id", { id: club_id  })
                .execute();
                
                console.log("check delete Data: ", exists);
                res.status(200).json({ message: 'Club deleted successfully' });  
               
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}


async function createMember(req, res, next) {
    console.log('POST /api/member API call made');

    const { club_id, club_member_id, club_member_request_status } = req.body;
    try {
        const connection = await DbUtils.getConnection();
        
                if(!await connection.manager.findOne(Club, { where: { Club_Id : club_id } })){
                    return res.status(500).json({ message: 'club not exist' });
                }
                else if(await connection.manager.findOne(Members, { where: { Club_Id : club_id, Club_Member_Id: club_member_id } })){
                    return res.status(500).json({ message: 'Already exists' });
                }
                else if(await connection.manager.findOne(Club, { where: { Club_Id : club_id, Club_owner_Id: club_member_id } })){
                    return res.status(500).json({ message: 'Already Owner of this club' });
                }

                let member = new Members();
                member.Club_Id = await connection.manager.findOne(Club, { where: { Club_Id : club_id } });
                member.Club_Member_Id = await connection.manager.findOne(User_Profile, { where: { User_Id : club_member_id } });
                member.Club_Member_Request_Status = club_member_request_status;
                await connection.manager.save(member);
                let club = await connection.manager.findOne(Club, { where: { Club_Id : club_id } });
                club.Member_Id = [await connection.manager.findOne(Members, { where: { Member_Id : member.Member_Id } })];
                await connection.manager.save(club);

                res.status(200).json({ message: 'Member Added successfully' }); 
               
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function getClubsFromUserId(req, res, next) {
    console.log('POST /api/clubowner API call made');
    const { user_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();

                let data1 = await connection.getRepository(Club).createQueryBuilder("cb")
                .innerJoinAndSelect('cb.Club_owner_Id', 'ow')
                .loadRelationCountAndMap('cb.Lobby_IdCount', 'cb.Lobby_Id')
                .where("cb.Club_owner_Id = :id", { id: user_id})
                .getMany();
                console.log({"Owner":data1});

                let data2 = await connection.getRepository(Members).createQueryBuilder("m")
                .innerJoinAndSelect('m.Club_Id', 'cb')
                .innerJoinAndSelect('cb.Club_owner_Id', 'ow')
                .loadRelationCountAndMap('cb.Lobby_IdCount', 'cb.Lobby_Id')
                .where("m.Club_Member_Id = :id", { id: user_id})
                .andWhere("m.Club_Member_Request_Status = :status", { status: "Approved"})
                .getMany();
                console.log({"Member":data2});

                let data = {"Owner":data1,"Member":data2};
                console.log("data: ", data);
                if(data) 
                {
                    return res.status(200).json({data});
                }
                throw new NotFoundError("Data Does not exists");
               
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function getApprovedMember(req, res, next) {
    console.log('POST /api/clubmember API call made');
    const { club_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();
       
                let data1 = await connection.getRepository(Club).createQueryBuilder()
                .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"User_Name"',
                'user.User_DisplayName"User_DisplayName"', 'user.User_Image"User_Image"'])
                .from(Club, 'cb')
                .innerJoin('cb.Club_owner_Id', 'user')
                .where("cb.Club_Id = :id", { id: club_id})
                .getRawMany();
                
                let data2 = await connection.getRepository(Members).createQueryBuilder()
                .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"User_Name"',
                'user.User_DisplayName"User_DisplayName"', 'user.User_Image"User_Image"'])
                .from(Members, 'm')
                .innerJoin('m.Club_Member_Id', 'user')
                .where("m.Club_Id = :id", { id: club_id})
                .andWhere("m.Club_Member_Request_Status = :status", { status: "Approved"})
                .getRawMany();
                
                let data = {"Owner":data1,"Member":data2}
                console.log({data});
                if(data)
                {
                    return res.status(200).json({data});
                }
                throw new NotFoundError("Data Does not exists");
               
    } catch (error) {
    console.log(error);
    throw new InternalServerError()
    }
}

async function pendingMembers(req, res, next) {
    console.log('POST /api/clubrequest API call made');
    const { club_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();
       
                let data1 = [];
                let data2 = await connection.getRepository(Members).createQueryBuilder()
                .select(['DISTINCT user.User_Id"User_Id"', 'user.User_Name"User_Name"',
                'user.User_DisplayName"User_DisplayName"', 'user.User_Image"User_Image"'])
                .from(Members, 'm')
                .innerJoin('m.Club_Member_Id', 'user')
                .where("m.Club_Id = :id", { id: club_id})
                .andWhere("m.Club_Member_Request_Status = :status", { status: "Pending"})
                .getRawMany();
                    let data = {"Owner":data1,"Member":data2}
                console.log({data});
                if(data) 
                {
                    return res.status(200).json({data});
                }
                throw new NotFoundError("Data Does not exists"); 
               
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
    
}


async function updateMember(req, res, next) {
    console.log('PUT /api/member API call made');

    const { club_id, club_member_id, club_member_request_status } = req.body;

    try {
        const connection = await DbUtils.getConnection();
       
                const exists = await connection.manager.findOne(Members, { where: { Club_Id: club_id, Club_Member_Id: club_member_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'Members is not exist, please try another'});
                }
                console.log("exists:", exists);
        
                const data = await connection.getRepository(Members)
                .createQueryBuilder()
                .update(Members)
                .set({ 
                    Club_Member_Request_Status: club_member_request_status
                })
                .where("Club_Id = :id", { id: club_id })
                .andWhere("Club_Member_Id = :ids", { ids: club_member_id })
                .execute();
                console.log("data:", data);
        
                res.status(200).json({ message: 'Data updated successfully' });  
                   
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
    
}

async function deleteMemberWithDetails(req, res, next) {
    console.log('DELETE /api/member API call made');
    const { club_id, club_member_id } = req.body;
        try {
            const connection = await DbUtils.getConnection();
           
                    const exists = await connection.manager.findOne(Members, { where: { Club_Id: club_id, Club_Member_Id: club_member_id } });
                    if(!exists) {
                        return res.status(409).json({ message: 'Members is not exist'});
                    }
                    console.log("delete Data1: ", exists);
                    let data = await connection.getRepository(Members).createQueryBuilder()
                    .delete()
                    .from(Members)
                    .where("Club_Id = :id", { id: club_id })
                    .andWhere("Club_Member_Id = :ids", { ids: club_member_id })
                    .execute();
            
                    console.log("check delete Data: ", exists);
                    res.status(200).json({ message: 'Members deleted successfully' });   
              
        } catch (error) {
            console.log(error);
            throw new InternalServerError()
    }  
}


async function searchClubById(req, res, next) {
    console.log('POST /api/club/detail API call made');
    const { club_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();
        
                let data = await connection.getRepository(Lobby).createQueryBuilder()
                .innerJoinAndSelect('Lobby.Club_Id', 'game')
                .where("Lobby.Club_Id = :id", { id: club_id})
                .andWhere("Lobby.Lobby_Status = :stats", { stats: "Upcoming"})
                .getRawMany();
                console.log("length: ", data.length);
                //if (data.length > 0) {
                    return res.status(200).json(data);
               // }
               // throw new NotFoundError("Data Does not exists"); 
               
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function createLobby(req, res, next) {
    console.log('POST /api/lobby API call made');

    const {  club_id, variation_id, lobby_owner_id, lobby_commision_rate, lobby_name, lobby_type, lobby_blinds, lobby_total_persons, lobby_join_players, lobby_action_time, lobby_boot_amount, lobby_auto_start, lobby_min_player_limit, lobby_auto_extension, lobby_time, lobby_pot_limit, lobby_min_bet, lobby_max_bet, room_id, lobby_status } = req.body;
    try {
        const connection = await DbUtils.getConnection();

                if(await connection.manager.findOne(Lobby, { where: { Lobby_Name : lobby_name } })) {
                    return res.status(409).json({ message: 'The Lobby Name has been taken, please try another'});
                }
        
                let lobby = new Lobby();
                lobby.Club_Id = await connection.manager.findOne(Club, { where: { Club_Id : club_id } });
                lobby.Variation_Id = await connection.manager.findOne(Variation, { where: { Variation_Id : variation_id } });
                lobby.Lobby_Owner_Id = await connection.manager.findOne(User_Profile, { where: { User_Id : lobby_owner_id } });
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

                let club = await connection.manager.findOne(Club, { where: { Club_Id : club_id } });
                club.Club_Lobby = [lobby.Lobby_Id];
                await connection.manager.save(club);
        
                res.status(200).json({ message: 'Lobby Added successfully' }); 
                
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}
async function updateLobby(req, res, next) {
    console.log('PUT /api/lobby API call made');

    const { lobby_id, lobby_name, lobby_commision_rate, lobby_blinds, lobby_total_persons, lobby_action_time, lobby_join_players, lobby_boot_amount, lobby_auto_start, lobby_min_player_limit, lobby_auto_extension, lobby_time, lobby_pot_limit, lobby_min_bet, lobby_max_bet, lobby_status} = req.body;
    try {
        const connection = await DbUtils.getConnection();
                const exists = await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'Lobby is not exist, please try another'});
                }

                const data = await connection.getRepository(Lobby)
                .createQueryBuilder()
                .update(Lobby)
                .set({ 
                    Lobby_Name: lobby_name,
                    Lobby_Commision_Rate: lobby_commision_rate,
                    Lobby_Blinds: lobby_blinds,
                    Lobby_Total_Persons: lobby_total_persons,
                    Lobby_Join_Players: lobby_join_players,
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
async function removeLobbiesFromLobbyId(req, res, next) {
    console.log('DELETE /api/lobby API call made');
    const { lobby_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();
       
                const exists = await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'Lobby is not exist'});
                }
                console.log("delete Data1: ", exists);
                let data = await connection.getRepository(Lobby).createQueryBuilder()
                .delete()
                .from(Lobby)
                .where("Lobby_Id = :id", { id: lobby_id })
                .execute();

                console.log("check delete Data: ", exists);
                res.status(200).json({ message: 'Lobby deleted successfully' });  
                
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function userPayment(req, res, next) {
    console.log('POST /api/payment API call made');
    const { user_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();
      
                const data = await connection.manager.find(Payment, { where: { User_Id: user_id } });

                if(data) {
                    return res.status(200).json({data});
                }
                throw new NotFoundError("Data Does not exists");
                
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}


async function userCreateLobbyHistory(req, res, next) {
    console.log('POST /api/lobby_historys API call made');

    const { lobby_id, user_id, user_win_status, amount, round_status, user_status, user_seating, lobby_round, total_bet } = req.body;
    try {
        const connection = await DbUtils.getConnection();
       
                let exists = await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'The Lobby is not Available'});
                }

                let lobby_history = new Lobby_History();
                lobby_history.Lobby_Id = await connection.manager.findOne(Lobby, { where: { Lobby_Id : lobby_id } });
                lobby_history.User_Id = await connection.manager.findOne(User_Profile, { where: { User_Id : user_id } });
                lobby_history.User_Win_Status = user_win_status;
                lobby_history.Amount = amount;
                lobby_history.Round_Status = round_status;
                lobby_history.User_Status = user_status;
                lobby_history.User_Seating = user_seating;
                lobby_history.Lobby_Round = lobby_round;
                lobby_history.Total_Bet = total_bet;
                
                await connection.manager.save(lobby_history);

                res.status(200).json({ message: 'Lobby History Added successfully' }); 
            
                
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function getAllLobbyHistoryData(req, res, next) {
    console.log('GET /api/lobby_history API call made');
    try {
        const connection = await DbUtils.getConnection();
        
                const [data, datacount] = await connection.manager.findAndCount(Lobby_History);
                console.log("all users:", datacount);
                if (datacount > 0) {
                    // console.log("users data....");
                    return res.status(200).json(data);
                }
                throw new NotFoundError("Data Does not exists");
           
                
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}

async function getLobbyHistoryDataByUserId(req, res, next) {
    console.log('POST /api/lobby_history API call made');
    const { user_id } = req.body;
    try {
        const connection = await DbUtils.getConnection();
       
            
                const data = await connection.manager.find(Lobby_History, { select: [ 'Lobby_History_Id', 'User_Win_Status', 'Amount', 'Lobby_Round', 'Total_Bet' ],where: { User_Id: user_id } });

                if(data) {
                    return res.status(200).json({data});
                }
                throw new NotFoundError("Data Does not exists");
                 
    } catch (error) {
        console.log(error);
        throw new InternalServerError()
    }
}



async function reGenerateToken(req, res, next) {
    
    console.log('POST /api/user/regeneratetoken API call made');

    const { user_id, user_token, device_id } = req.body;

    try{
        const connection = await DbUtils.getConnection();

       const loginuser = await connection.manager.findOne(Auth, { where: { User_Id : user_id, Device_Id: device_id } });
       if(loginuser.Jwt_Token == user_token) {
               //return res.status(409).json({ message: 'User Token is Valid'});
           let tokengen =tokenGenerator.generate();
           console.log(tokengen);
           const data = await connection.getRepository(Auth)
           .createQueryBuilder()
           .update(Auth)
           .set({ 
               Jwt_Token : tokengen,
               Currently_Playing : true
           })
           .where("User_Id = :id", { id: user_id})
           .execute();
           
           console.log(data);
           return res.status(200).json({ Issuccessful: true , user_id : user_id, token : tokengen });
       }
       return res.status(200).json({ Issuccessful: false }); 

    } catch (error){

        console.log(error);
        throw new InternalServerError()
    } 
}
    
// async function payFromUser(req,res,next){
//     const {user_id,payment_image,payment_amount}=req.body;
//     try{
//         const connection = await DbUtils.getConnection();
//         const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
//             if(!exists) {
//                     return res.status(409).json({ message: 'User is not registered with us, please try another'});
//                 }

//             const payment =new PaymentPaytm();
//             payment.User_Id=user_id;
//             payment.Payment_Amount=payment_amount;
//             payment.Payment_Image=payment_image;
//             const user=await connection.manager.save(payment);
//             return res.status(200).json(user);

//             }catch(error){
//                 console.log(error);
//                 throw new InternalServerError();
//             }
// }

// async function paymentStatusApproveByAdmin(req,res,next){
//     const {user_id,payment_id}=req.body;

//     try{
//         const connection = await DbUtils.getConnection();
//         const paymentData = await connection.manager.findOne(PaymentPaytm, { where: {Payment_Id:payment_id ,User_Id: user_id } });
//         if(!paymentData){
//             throw new NotFoundError("Data Does not exists");
//         }

//         if(paymentData.Payment_Status == "Pending" || paymentData.Payment_Status == "Rejected"){
//             return res.status(200).json({});
//         }
        

//     }catch(error){
//         console.log(error);
//         throw new InternalServerError();
//     }
//     }


export const userController = {userRegister,
    verifyMobile,
    userLogin,
    userLogout,
    updateProfile,
    changePassword,
    userDetailByUserId,
    createClub,
    getClubFromClubId,
    updateClubWithClubId,
    removeClubAndDetails,
    createMember,
    getClubsFromUserId,
    getApprovedMember,
    pendingMembers,
    updateMember,
    deleteMemberWithDetails,
    searchClubById,
    createLobby,
    updateLobby,
    removeLobbiesFromLobbyId,
    userPayment,
    userCreateLobbyHistory,
    getAllLobbyHistoryData,
    getLobbyHistoryDataByUserId,
    reGenerateToken
}