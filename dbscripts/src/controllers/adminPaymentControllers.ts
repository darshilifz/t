import express from "express";
//import { adminPaymentController } from "./paymentControllers";
import { clientToken } from "../middlewares/checkJWT";
import { InternalServerError, NotFoundError } from "../errors/InstancesCE";
import { DbUtils } from "../utils/DbUtils";
import { User_Profile } from "../entity/User_Profile";
import { Payment } from "../entity/Payment";


//const router = express.Router();
// router.put(
//   "/getAllPaymentRequest",
//   clientToken,
//   adminPaymentController.getAllPaymentRequest
// ); // api call
// router.put(
//   "/paymentStatusUpdate",
//   clientToken,
//   adminPaymentController.paymentStatusUpdate
// ); // api call

async function getAllPaymentRequest(req, res, next) {
  console.log("POST /api/getAllPaymentRequest API call made");
  const {skip}=req.body;
  try {
    const connection = await DbUtils.getConnection();

    // const payment = await connection.manager.find(Payment, {
    //   where: { Status: 2 },
    //   take:10
    // });
    //const skip=1;
    const payment = await connection
      .getRepository(Payment)
      .createQueryBuilder()
      .where({ Status: 2 })
      .take(10)
      .skip(skip)
      .getRawMany();

    if (payment) {
      return res.status(200).json( payment );
    }

    throw new NotFoundError("Data Does not exists");
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function paymentStatusUpdate(req, res, next) {
  console.log("POST /api/paymentStatusUpdate API call made");
  const { user_id, payment_id, amount, status, remark } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
    if(!exists) {
        return res.status(409).json({ message: 'User is not registered with us, please try another'});
    }

    const exists1 = await connection.manager.findOne(Payment, {
      where: { Payment_Id: payment_id, User_Id: user_id },
    });
    if (!exists1) {
      return res
        .status(409)
        .json({ message: "Payment is not exist, please try another" });
    }

    const updatePayment = await connection
      .getRepository(Payment)
      .createQueryBuilder()
      .update(Payment)
      .set({
        Payment_Amount: Number(amount),
        Status: Number(status),
        Remark: remark,
      })
      .where("Payment_Id = :id", { id: payment_id })
      .andWhere("User_Id = :user_id", { user_id: user_id })
      .execute();

    return res.status(200).json({ message: "Updated Successfully" });
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

export const adminPaymentController = {
  getAllPaymentRequest,
  paymentStatusUpdate,
};
