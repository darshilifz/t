
const express = require('express');
import { DbUtils } from "./utils/DbUtils";
import { User_Profile } from "./entity/User_Profile";
import { Wallet } from "./entity/Wallet";
import { Game } from "./entity/Game";
import { Variation } from "./entity/Variation";
import { Club } from "./entity/Club";
import { Lobby } from "./entity/Lobby";
import { Lobby_History } from "./entity/Lobby_History";
import { Auth } from "./entity/Auth";
import { Admin } from "./entity/Admin";
import { Payment } from "./entity/Payment";
import { matchMaker } from "colyseus";
import { metadata } from "../../src/metadata"
import { Members } from "./entity/Members";
import { Lobby_Commision } from "./entity/Lobby_Commision";
var Passwordhash = require('password-hash');
import config from "./config/config";
const TokenGenerator = require('uuid-token-generator');
import * as jwt from "jsonwebtoken";
let tokenGenerator = new TokenGenerator();

async function  Disposing_lobby(Lobby_id:number)
    {
        const connection = await DbUtils.getConnection();
        let lobby = await connection.getRepository(Lobby)
        .createQueryBuilder()
        .update(Lobby)
        .set({ Lobby_Status : "Completed" })
        .where("Lobby_Id = :id", { id: Lobby_id })
        .execute();
        
        console.log(Lobby_id);
        console.log(lobby);
    }

const router = express.Router();
//=======================Token============================

// //JWT START
// const token = jwt.sign(
//     { userId: loginuser.id, username: user_name},
//     config.jwtSecret,
//     { expiresIn: "1h" }
//   );
//  //JWT END 
// return res.setHeader('Authorization', `Bearer ${token}`).status(200).json({ message: 'User login successfully' })



//#region paritosh
//=======================Testing============================

/**
 * Test API for Checking if Server is up
 */
 router.get('/admin/',async (req, res) => {
    console.log(req.hostname);
    res.send(`The Server is up on ${req.hostname}!!`);
});


//Create the lobby in paritcular 
router.post('/createroom', async (req, res) => {
    const options = req.body;
     const roomName = options.Customoptions.type;
    console.log(options);
    //const connection = await DbUtils.getConnection();
    
    // if (await connection.manager.findOne(Lobby, { where: { Lobby_Name: options.roomName } })) {
    //     return res.status(409).json({ message: 'The Lobby Name has been taken, please try another' });
    // }
    
     const rooms = await matchMaker.create(roomName, options);   
    // let lobby = new Lobby();
    // lobby.Club_Id = await connection.manager.findOne(Club, { where: { Club_Id: options.club_ID } });
    // lobby.Variation_Id = await connection.manager.findOne(Variation, { where: { Variation_Id: 5 } });
    // lobby.Lobby_Owner_Id = await connection.manager.findOne(User_Profile, { where: { User_Id: options.owner_ID } });
    // lobby.Lobby_Commision_Rate = 3;
    // lobby.Lobby_Name = options.roomName;
    // lobby.Lobby_Type = options.type;
    // lobby.Lobby_Blinds = options.blinds;
    // lobby.Lobby_Total_Persons = options.numberOfPlayers;
    // lobby.Lobby_Join_Players = 5;
    // lobby.Lobby_Action_Time = options.ActionTimeValue;
    // lobby.Lobby_Boot_Amount = options.bootAmount;
    // lobby.Lobby_Auto_Start = options.AutoStartPlayerNumber;
    // lobby.Lobby_Min_Player_Limit = 2;
    // lobby.Lobby_Auto_Extension = options.AutoExtension;
    // lobby.Lobby_Time = "10";
    // lobby.Lobby_Pot_Limit = options.maxPotLimit;
    // lobby.Lobby_Min_Bet = options.bootAmount;
    // lobby.Lobby_Max_Bet = options.maxBet;
    // lobby.Room_Id = rooms.sessionId;
    // await connection.manager.save(lobby);

    // // let lobby1 = await connection.manager.findOne(Lobby, { where: { Lobby_Id: lobby.Lobby_Id } });
    // // lobby1.Room_Id = "";
    // // await connection.manager.save(lobby);
    res.send(`Lobby is created successful`);
    // const room = await matchMaker.getRoomById(rooms.room.roomId);
    // room.state.Lobby_id = lobby.Lobby_Id;
    // room.state.Commission_Rate = 3;
    // console.log(room.state);
    // let meta : metadata = new metadata();
    // meta.Setvalue(options.roomName,options.pwd,options.owner_ID,options.club_ID,lobby.Lobby_Id)
    // room.setMetadata(meta);
    // console.log(room.metadata);
});

router.get('/roomdeatils', async (req, res) => {
    console.log(req.hostname);
    const connection = await DbUtils.getConnection();
    //console.log(connection);
    const rooms = await matchMaker.query({});

    console.log(rooms);

    res.send(`The Server is up on ${req.hostname}!!`)
});

router.get('/state/:room_id', async (req, res) => {
    console.log(req.hostname + req.params.room_id);
    const connection = await DbUtils.getConnection();
    //console.log(connection);
    const rooms = await matchMaker.getRoomById(req.params.room_id);

    console.log(rooms.state);

    res.send(`The Server is up on ${req.hostname}!!`)
});

router.get('/disponse/:room_id', async (req, res) => {
    console.log(req.hostname + req.params.room_id);
    const connection = await DbUtils.getConnection();
    //console.log(connection);
    const rooms = await matchMaker.getRoomById(req.params.room_id);
    if(!rooms){
        return res.status(409).json({ message: 'The Room is not available'});
    }
    rooms.disconnect();

    res.send(`The Server is up on ${req.hostname}!!`)
});
//#endregion

//#region admin
//=======================Token============================

router.post('/admin/regenerate/token', async (req, res) => {
   
});

//=======================Registration & Login============================

/**
 * API to Create a new User (Registration)
 * Data Input Body
{
    "user_name":"ABC", "user_displayname":"ABC", "user_password":"qwer", "user_country":"India", "user_mob_no":7894561230, "user_email_id":"abc@gmail.com", "user_image":"Profile.png"
}
 */
//  router.post('/admin/user/register', async (req, res) => {
 
// });


//=======================User full detail============================

/**
 * API to get a All Users details (User_Profile, Wallet) full details admin
 */
//  router.get('/admin/users', async (req, res) => {
    
//  });

 /**
 * API to post a All Users details by user_name (User_Profile, Wallet) full details
 */
//   router.post('/admin/user', async (req, res) => {
    
//  });

 /**
 * Remove a User details from user_id
 */
//   router.delete('/admin/user', async (req, res) => {
  
// });

//=======================Game only============================

/**
 * API to get a All Games Only Admin
 */
//  router.get('/admin/games', async (req, res) => {
 
    
// });

/**
 * API to get a Game Only from game_name (searching by name)
 */
//  router.post('/admin/games', async (req, res) => {
   
    
// });

//=======================Variation======================

/**
 * API to get a Variation from game_name (searching by name) admin
 */
//  router.post('/admin/variation/game', async (req, res) => {
    
    
// });

//=======================Club============================

/**
 * API to Create a new Club
 * Data Input Body
{
    "club_name":"Demo", "club_initial":"DEM", "club_logo":"club.png", "club_money":2000, "club_notice":"it's notice", "club_owner_id":1
}
 */
// router.post('/admin/club', async (req, res) => {
    
    
// });

/**
 * API to get a All Club------------------------------------------------------------------------------------changes Pending
 */
// router.get('/admin/clubs', async (req, res) => {
  
    
// });

/**
 * API to get a Club from club_name (searching by name)
 */
//  router.get('/admin/club', async (req, res) => {
    
    
// });

/**
 * Update a Club from club_id
 * * Data Input Body
{
    "club_id":1, "club_name":"Demo", "club_initial":"DEM", "club_logo":"club.png", "club_money":2000, "club_notice":"it's notice", "club_owner_id":1, "club_member_id":2, "club_member_request_status":"Pending"
}
 */
// router.put('/admin/club', async (req, res) => {
    
    
// });

/**
 * Remove a Club with lobbies from club_id
 */
//  router.delete('/admin/club', async (req, res) => {
    
    
// });

//=======================Lobby only============================

/**
 * API to Create a new Lobby
 * Data Input Body
{
    "club_id":1, "variation_id":2, "lobby_owner_id":1,"lobby_commision_rate":2,"lobby_name":"Test", "lobby_type":"ORG", "lobby_blinds":4, "lobby_total_persons":9, "lobby_join_players":4, "lobby_action_time":30, "lobby_boot_amount":500, "lobby_auto_start":false, "lobby_min_player_limit":2, "lobby_auto_extension":false, "lobby_time":"5:00", "lobby_pot_limit":50000, "lobby_min_bet":50, "lobby_max_bet":5000, "lobby_status": "Upcoming", "room_id":"AFRRG23"
}
 */
// router.post('/admin/lobby', async (req, res) => {
    
    
// });

/**
 * API to get a All Lobby
 */
//  router.get('/admin/lobbies', async (req, res) => {
   
    
// });

/**
 * API to get a Lobby from club_id (searching by id)
 */
//  router.post('/admin/lobbies', async (req, res) => {
    
    
// });

/**
 * API to get a Open Lobby from club_id (searching by id)
*/
// router.get('/admin/openlobbies', async (req, res) => {
	

// });

/**
 * Update a Lobby from lobby_id
 * * Data Input Body

 */
// router.put('/admin/lobby', async (req, res) => {
    
    
// });



//=======================Lobby_History============================

/**
 * API to get a Lobby_History from lobby_id (searching by id)
 */
//  router.post('/admin/lobby_history', async (req, res) => {
    
    
// });

//=======================Leisure============================

/**
 * API to get a leisure  from lobby_id (searching by id)
 */
// router.get('/admin/leisure', async (req, res) => {
    
    
// });

/**
 * API to get a leisureplayer  from lobby_id (searching by id)
 */
//  router.post('/admin/leisureplayer', async (req, res) => {
    
    
// });


//=======================Admin============================

/**
 * API to Verify a new Admin (login)
 */
//  router.post('/admin/login', async (req, res) => {
    
// });

/**
 * API to Create a Admin
 * {
    "admin_name":"admin4", "admin_role":"SubAdmin", "admin_password":"admin" 
}
 */
//  router.post('/admin/createadmin', async (req, res) => {
   
    
// });

/**
 * API to get a All Admin
 */
//  router.get('/admin/admins', async (req, res) => {
    
// });

/**
 * API to get a Admin from admin_name (searching by name)
 */
//  router.post('admin/admins', async (req, res) => {
    
// });

/**
 * Update a Admin from admin_id
 * * Data Input Body
{
    "admin_id":1, "admin_name":"admin4", "admin_role":"SubAdmin", "admin_password":"admin" 
}
 */
// router.put('/admin/admin', async (req, res) => {
    
// });

/**
 * Remove a Admin from admin_id
 */
//  router.delete('/admin/admin', async (req, res) => {
    
    
// });

//=======================Payment============================

/**
 * API to Create a new Payment
 * Data Input Body
{
    "user_id":7, "isdebitcredit":0, "payment_amount":3000
}
*/
// router.post('/admin/payments', async (req, res) => {
    
    
// });


/**
 * API to get a All Payment
 */
//  router.get('/admin/payment', async (req, res) => {
   
    
// });

/**
 * API to get a Payment from user_id (searching by id)
 */
//  router.post('/admin/payment', async (req, res) => {
    
    
// });

//=======================Commision============================


/**
 * API to get a All Users Commision details (User_Profile, Wallet) full details admin
 */
//  router.get('/admin/commision', async (req, res) => {
   
    
//  });

 /**
 * API to post a All Users commision details by user_name (User_Profile, Wallet) full details
 */
//   router.post('/admin/commision', async (req, res) => {
    
    
//  });
//=======================Admin Commision============================

/**
 * API to Create a Admin Commision
 * {
    "lobby_id":1, "lobby_round":1, "total_bet":5000, "total_commision_amount":500
}
 */
// router.post('/admin/createourcommision', async (req, res) => {
    
            
// });

/**
 * API to get a All Users Commision details (User_Profile, Wallet) full details admin
 */
// router.get('/admin/ourcommision', async (req, res) => {

            
//          });


/**
 * API to post a All Users commision details by user_name (User_Profile, Wallet) full details
 */
// router.post('/admin/ourcommision', async (req, res) => {

            
//          });


//=======================Dashboard============================

/**
 * API to get dashboard count
 */
//  router.get('/admin/dashboard', async (req, res) => {
   
//  });
//#endregion


//#region Gameplay

//=======================Registration & Login============================

/**
 * API to Create a new User (Registration)
 * Data Input Body
{
    "user_name":"ABC", "user_displayname":"ABC", "user_password":"qwer", "user_country":"India", "user_mob_no":7894561230, "user_email_id":"abc@gmail.com", "user_image":"Profile.png"
}
 */
router.post('/user/register', async (req, res) => {
    console.log('POST /api/user/register API call made');

});

/**
 * API to Verify a new User (login)
 */
 router.post('/user/login', async (req, res) => {
    
});

/**
 * API to logout a User or Quit Application
 */
 router.post('/user/logout', async (req, res) => {
    console.log('POST /api/user/logout API call made');

     
});

/**
 * API to Regenerate new token
 */
 router.post('/user/regeneratetoken', async (req, res) => {
    
});


/**
 * API to Verify a new User with mobile number
 */
 router.post('/user/mobile', async (req, res) => {
    
});

//=======================User Profile============================

/**
 * Update a User Profile from user_id
 */
 router.put('/user/profile', async (req, res) => {
    
});

/**
 * Update a Password from user_id
 */
 router.put('/user/changepassword', async (req, res) => {
    console.log('PUT /api/user/changepassword API call made');

    
});


//=======================User for game============================


/**
* API to get a All Users details by user_id (User_Profile, Wallet) for whole game page
*/
router.post('/user/detail', async (req, res) => {

});

//=======================Club============================

/**
 * API to Create a new Club
 * Data Input Body
{
    "club_name":"Demo", "club_initial":"DEM", "club_logo":"club.png", "club_money":2000, "club_notice":"it's notice", "club_owner_id":1
}
 */
router.post('/club', async (req, res) => {
    
    
});

/**
 * API to get a Club from club_id (searching by id)
 */
 router.post('/clubdata', async (req, res) => {
    
});

/**
 * Update a Club from club_id
 * * Data Input Body
{
    "club_id":1, "club_name":"Demo", "club_initial":"DEM", "club_logo":"club.png", "club_money":2000, "club_notice":"it's notice", "club_owner_id":1, "club_member_id":2, "club_member_request_status":"Pending"
}
 */
 router.put('/club', async (req, res) => {
    
});

/**
 * Remove a Club with lobbies & members from club_id-----------------------check
 */
 router.delete('/club', async (req, res) => {
   
    
});

//=======================Member============================

/**
 * API to Create a new Member
 * Data Input Body
{
    "club_id":1, "club_member_id":1, "club_member_request_status":"Pending"
}
 */
router.post('/member', async (req, res) => {
    
});

/**
 * API to get a Clubs from user_id (searching by id)---------------Member
 */
 router.post('/clubowner', async (req, res) => {
    
    
});

/**
* API to get a approved Members list from club_id (searching by id)
*/
router.post('/clubmember', async (req, res) => {
   
});
    

/**
 * API to get a pending Members list from club_id (searching by id)
 */
 router.post('/clubrequest', async (req, res) => {
 
});

/**
 * Update a Member from club_id, user_id
 * * Data Input Body
{
    "club_id":1, "club_member_id":1, "club_member_request_status":"Pending"
}
 */
router.put('/member', async (req, res) => {
    
    
});

/**
 * Remove a Member with lobbies from club_id, user_id
 */
 router.delete('/member', async (req, res) => {
      
});

/**
 * API to get a Club full from club_id (searching by id)
 */
 router.post('/club/detail', async (req, res) => {
  
});

//=======================Lobby only============================

/**
 * API to Create a new Lobby
 * Data Input Body
{
    "club_id":1, "variation_id":2, "lobby_owner_id":1,"lobby_commision_rate":2,"lobby_name":"Test", "lobby_type":"ORG", "lobby_blinds":4, "lobby_total_persons":9, "lobby_join_players":4, "lobby_action_time":30, "lobby_boot_amount":500, "lobby_auto_start":false, "lobby_min_player_limit":2, "lobby_auto_extension":false, "lobby_time":"5:00", "lobby_pot_limit":50000, "lobby_min_bet":50, "lobby_max_bet":5000
}
 */
router.post('/lobby', async (req, res) => {
    
});

/**
 * API to Update a new Lobby
 * Data Input Body
{
    "lobby_id":1, "lobby_commision_rate":2, "lobby_name":"Test", "lobby_blinds":4, "lobby_total_persons":9, "lobby_join_players":4, "lobby_action_time":30, "lobby_boot_amount":500, "lobby_auto_start":false, "lobby_min_player_limit":2, "lobby_auto_extension":false, "lobby_time":"5:00", "lobby_pot_limit":50000, "lobby_min_bet":50, "lobby_max_bet":5000, "lobby_status":"Upcoming"
}
 */
router.put('/lobby', async (req, res) => {
    
    
});

/**
 * Remove a lobbies from lobby_id
 */
 router.delete('/lobby', async (req, res) => {
    
});

//=======================Lobby_History============================

/**
 * API to Create a new Lobby_History
 * Data Input Body
{
    "lobby_id":1, "user_id":2, "user_win_status":1,"amount":2000,"round_status":1, "user_status":1, "user_seating":1, "lobby_round":2, "total_bet":700
}
 */
router.post('/lobby_historys', async (req, res) => {
 
});

/**
 * API to get a All Lobby_History
 */
 router.get('/lobby_history', async (req, res) => {
    
    
});

/**
 * API to get a Lobby_History from user_id (searching by id)
 */
 router.post('/lobby_history', async (req, res) => {
  
});

//=======================Payment============================

/**
 * API to get a Payment from user_id (searching by id)
 */
 router.post('/payment', async (req, res) => {
    
});

//#endregion


//#endregion
module.exports = {router,Disposing_lobby};
