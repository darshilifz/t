import express from 'express';
// import { paymentController } from  '../controllers/paymentControllers';
import {paymentController} from '../controllers/paymentControllers';
import { clientToken } from '../middlewares/checkJWT';

const router = express.Router();


router.put("/imageUpload",  paymentController.imageUpload); // api call
router.put("/payInStatus",  paymentController.payInStatus); // api call
router.put("/withdrawMoney",  paymentController.withdrawMoney); // api call
router.put("/withdrawStatus",  paymentController.withdrawStatus); // api call
router.put("/getUPIId",  paymentController.getUPIId); // api call

module.exports=router;
