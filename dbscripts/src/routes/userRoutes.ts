import express from 'express';
import {userController} from '../controllers/userControllers';
import { clientToken } from '../middlewares/checkJWT';

const router = express.Router();

router.get('/check',async (req, res, next) => {
 
    console.log(req.hostname);
    res.send(`The Server is up on ${req.hostname}!!`);
    });

router.post('/register',  userController.userRegister);
router.post('/login', userController.userLogin);
router.put('/logout', clientToken, userController.userLogout);
router.post('/mobile', clientToken, userController.verifyMobile);

router.put('/profile', clientToken, userController.updateProfile);
router.put('/changepassword', clientToken, userController.changePassword);

//
router.post('/detail', clientToken, userController.userDetailByUserId);

//
router.post('/club', clientToken, userController.createClub);
router.post('/clubdata', clientToken, userController.getClubFromClubId);
router.put('/club', clientToken, userController.updateClubWithClubId);
router.delete('/club', clientToken, userController.removeClubAndDetails);

router.post('/member', clientToken, userController.createMember);
router.post('/clubowner', clientToken, userController.getClubsFromUserId);
router.post('/clubmember', clientToken, userController.getApprovedMember);
router.post('/clubrequest', clientToken, userController.pendingMembers);

router.put('/member', clientToken, userController.updateMember);
router.delete('/member', clientToken, userController.deleteMemberWithDetails);
router.post('/club/detail', clientToken, userController.searchClubById)

router.get('/payment', clientToken, userController.userPayment);

router.post('/lobby', clientToken, userController.createLobby);
router.put('/lobby', clientToken, userController.updateLobby);
router.delete('/lobby', clientToken, userController.removeLobbiesFromLobbyId);

router.post('/lobby_historys', clientToken, userController.userCreateLobbyHistory);
router.get('/lobby_history', clientToken, userController.getAllLobbyHistoryData);
router.post('/lobby_history', clientToken, userController.getLobbyHistoryDataByUserId);

router.post('/regeneratetoken', clientToken, userController.reGenerateToken);

//paytm payment routes

// router.post('/payment_from_user',userController.payFromUser);

module.exports = router;
