import express from 'express';
import { adminController } from '../controllers/adminControllers';
import {checkJwtToken} from '../middlewares/checkJWT';

const router = express.Router();

router.get('/', (req, res)=>{
    console.log("IN CHECKING");
   res.send({message:"In Checking"}) 
});

router.post('/user/register', adminController.adminRegister);
router.get('/users', checkJwtToken, adminController.getAlluserDetails);
router.post('/user', checkJwtToken, adminController.getUserByUsername);
router.delete('/user', checkJwtToken, adminController.deleteuserDetailsFromUserId);

router.get('/games', checkJwtToken, adminController.getAllGames);
router.post('/games', checkJwtToken, adminController.getGameByGameName);
router.post('/variation/game', checkJwtToken, adminController.getVariationByGameName);

router.post('/club', checkJwtToken, adminController.createClub);
router.get('/clubs', checkJwtToken, adminController.getAllClub);
router.get('/club', checkJwtToken, adminController.getClubByClubName);
router.put('/club', checkJwtToken, adminController.updateClubWithClubId);
router.delete('/club', checkJwtToken, adminController.removeClubWithLobbies);

router.post('/lobby', checkJwtToken, adminController.createLobby);
router.get('/lobbies', checkJwtToken, adminController.getAllLobies);
router.post('/lobbies', checkJwtToken, adminController.getLobbyFromClubId);
router.put('/lobby', checkJwtToken, adminController.updateLobbyFromLobbyId);

router.get('/openlobbies', checkJwtToken, adminController.getOpenLFromCludId);

router.post('/lobby_history', checkJwtToken, adminController.lobbyHistoryFromLobbyId);

router.get('/leisure', checkJwtToken, adminController.lobbyHistoryFromLobbyId);
router.post('/leisureplayer', checkJwtToken, adminController.leisurePlayerFromLobbyId);

router.post('/login', checkJwtToken, adminController.adminLogin);
router.post('/createadmin', adminController.adminCreateAdmin);
router.get('/admins', checkJwtToken, adminController.getAllAdmins);
router.post('/admins', checkJwtToken, adminController.getAdminFromAdminName);
router.put('/admin',  adminController.updateAdminFromAdminId);
router.delete('/admin', checkJwtToken, adminController.deleteAdminWithAdminId);

router.post('/payments', checkJwtToken, adminController.createPayment);
router.get('/payment', checkJwtToken, adminController.getAllPayments);
router.post('/payment', checkJwtToken, adminController.getPaymentFromUserId);

router.get('/commision', checkJwtToken, adminController.getAllUsersCommission);
router.post('/commision', checkJwtToken, adminController.adminOurCommissionByUserName);

router.post('/createourcommision', checkJwtToken, adminController.adminCreateOurCommission);
router.get('/ourcommision', checkJwtToken, adminController.adminOurCommision);
router.post('/ourcommision', checkJwtToken, adminController.adminOurCommissionByUserName);

router.get('/dashboard', checkJwtToken, adminController.adminDashboard);

//payment
//router.put('/paymentApprove',adminController.paymentApprove);


module.exports = router;
