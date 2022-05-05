import express from 'express';
import {fbControllers} from '../controllers/fbControllers';
import { clientToken } from '../middlewares/checkJWT';

const router = express.Router();

router.get('/check',async (req, res, next) => {
 
    console.log(req.hostname);
    res.send(`The Server is up on ${req.hostname}!!`);
    });

router.post('/login', fbControllers.userLogin);
router.put('/logout', clientToken, fbControllers.userLogout);
router.put('/lobbyentryexit', clientToken, fbControllers.userlobbyentry);

router.put('/profile', clientToken, fbControllers.updateProfile);
router.post('/detail', clientToken, fbControllers.userDetailByUserId);
router.post('/club', clientToken, fbControllers.createClub);
router.post('/clubdata', clientToken, fbControllers.getClubFromClubId);
router.put('/club', clientToken, fbControllers.updateClubWithClubId);
router.delete('/club', clientToken, fbControllers.removeClubAndDetails);
router.post('/member', clientToken, fbControllers.createMember);
router.post('/clubowner', clientToken, fbControllers.getClubsFromUserId);
router.post('/clubmember', clientToken, fbControllers.getApprovedMember);
router.post('/clubrequest', clientToken, fbControllers.pendingMembers);
router.put('/member', clientToken, fbControllers.updateMember);
router.delete('/member', clientToken, fbControllers.deleteMemberWithDetails);
router.post('/club/detail', clientToken, fbControllers.searchClubById)
router.get('/payment', clientToken, fbControllers.userPayment);
router.put('/wallet', clientToken, fbControllers.updateChips);
router.post('/lobby', clientToken, fbControllers.createLobby);
router.put('/lobby', clientToken, fbControllers.updateLobby);
router.delete('/lobby', clientToken, fbControllers.removeLobbiesFromLobbyId);
router.post('/lobby_historys', clientToken, fbControllers.userCreateLobbyHistory);
router.get('/lobby_history', clientToken, fbControllers.getAllLobbyHistoryData);
router.post('/lobby_history', clientToken, fbControllers.getLobbyHistoryDataByUserId);
router.post('/regeneratetoken', clientToken, fbControllers.reGenerateToken);

module.exports = router;
