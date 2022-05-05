import express from 'express';
import { adminPaymentController } from '../controllers/adminPaymentControllers';
import {checkJwtToken} from '../middlewares/checkJWT';

const router = express.Router();


router.put(
    "/getAllPaymentRequest",
    
    adminPaymentController.getAllPaymentRequest
  ); // api call
  router.put(
    "/paymentStatusUpdate",
    
    adminPaymentController.paymentStatusUpdate
  ); // api call




module.exports=router;