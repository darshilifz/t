import express from "express";
import "reflect-metadata";
//import { paymentController } from "../controllers/paymentControllers";
import { clientToken } from "../middlewares/checkJWT";
import { InternalServerError, NotFoundError } from "../errors/InstancesCE";
import { DbUtils } from "../utils/DbUtils";
import { User_Profile } from "../entity/User_Profile";
import { Payment } from "../entity/Payment";

//const router = express.Router();

// router.put("/imageUpload", clientToken, paymentController.imageUpload); // api call
// router.put("/payInStatus", clientToken, paymentController.payInStatus); // api call
// router.put("/withdrawMoney", clientToken, paymentController.withdrawMoney); // api call
// router.put("/withdrawStatus", clientToken, paymentController.withdrawStatus); // api call
// router.put("/getUPIId", clientToken, paymentController.getUPIId); // api call

/* you have to add columns in below models
  Payment: 
     @Column("longblob")
      Payment_Image: string;

      @Column()
      Status: number; // 0-Success, 1-Failed, 2-Pending

      @Column("text")
      Remark: string;

  User_Profile:
      @Column("varchar")
      User_UPI_Id: string;
*/

async function imageUpload(req, res, next) {
  console.log("POST /api/imageUpload API call made");
  const { user_id, payment_amount, payment_image } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
    if(!exists) {
        return res.status(409).json({ message: 'User is not registered with us, please try another'});
    }
    let payment = new Payment();
    payment.User_Id = await connection.manager.findOne(User_Profile, {
      where: { User_Id: user_id },
    });
    payment.Is_DebitCredit = false;

    console.log("imageUpload credit:", payment.Is_DebitCredit);

    payment.Payment_Amount = payment_amount;
    payment.Payment_Image = payment_image;
    payment.Remark = "";
    payment.Status = 2;

    await connection.manager.save(payment);

    console.log("imageUpload:", payment.User_Id.User_Id);

    res.status(200).json({ status: 2 });
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function payInStatus(req, res, next) {
  console.log("POST /api/payInStatus API call made");
  const { user_id } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
    if(!exists) {
        return res.status(409).json({ message: 'User is not registered with us, please try another'});
    }
    // const payment = await connection.manager
    //   .find(Payment, {
    //     where: { User_Id: user_id, Is_DebitCredit: false },
    //   })
    //   .limit(50)
    //   .sort({ Payment_Time_Date: -1 });
    const payment = await connection
      .getRepository(Payment)
      .createQueryBuilder()
      .orderBy("Payment_Time_Date", "DESC")
      .where({ User_Id: user_id, Is_DebitCredit: false })
      .take(50).getRawMany();

    //  // let data = await connection.getRepository(Payment).find({User_Id:user_id,Is_DebitCredit:false}).limit(1).sort({Payment_Time_Date: -1})
    //   const data1=await connection.createQueryBuilder()
    //     .select()
    //     .from(Payment, "payment")
    //     .where("payment.userIdUserId=1");
    //   if(data1){
    //     return res.status(200).json(data1);
    //   }

    if (payment) {
      return res.status(200).json(payment);
    }
    throw new NotFoundError("Data Does not exists");
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function withdrawMoney(req, res, next) {
  console.log("POST /api/withdrawMoney API call made");
  const { user_id, payment_image, withdraw_amount } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
    if(!exists) {
        return res.status(409).json({ message: 'User is not registered with us, please try another'});
    }

    let payment = new Payment();
    payment.User_Id = await connection.manager.findOne(User_Profile, {
      where: { User_Id: user_id },
    });
    payment.Is_DebitCredit = true;

    console.log("withdrawMoney debit:", payment.Is_DebitCredit);

    payment.Payment_Amount = withdraw_amount;
    payment.Payment_Image = payment_image;
    payment.Remark = "";
    payment.Status = 2;

    await connection.manager.save(payment);

    console.log("withdrawMoney:", payment.User_Id.User_Id);

    res.status(200).json({ status: 2 });
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function withdrawStatus(req, res, next) {
  console.log("POST /api/withdrawStatus API call made");
  const { user_id } = req.body;
  try {
    const connection = await DbUtils.getConnection();
const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
                if(!exists) {
                    return res.status(409).json({ message: 'User is not registered with us, please try another'});
                }
    // const payment = await connection.manager
    //   .find(Payment, {
    //     where: { User_Id: user_id, Is_DebitCredit: true },
    //   })
    //   .limit(50)
    //   .sort({ Payment_Time_Date: -1 });

    const payment = await connection
    .getRepository(Payment)
    .createQueryBuilder()
    .orderBy("Payment_Time_Date", "DESC")
    .where({ User_Id: user_id, Is_DebitCredit: true })
    .take(50).getRawMany();

    if (payment) {
      return res.status(200).json(payment);
    }
    throw new NotFoundError("Data Does not exists");
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function getUPIId(req, res, next) {
  console.log("POST /api/getUPIId API call made");
  const { user_id } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
    if(!exists) {
        return res.status(409).json({ message: 'User is not registered with us, please try another'});
    }
    const user = await connection.manager.find(User_Profile, {
      where: { User_Id: user_id },
    });

    if (user) {
      return res.status(200).json({
        user_upi_id: user.User_UPI_Id,
      });
    }
    throw new NotFoundError("Data Does not exists");
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

export const paymentController = {
  imageUpload,
  getUPIId,
  payInStatus,
  withdrawMoney,
  withdrawStatus,
};
