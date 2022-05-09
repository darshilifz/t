import express from "express";
import "reflect-metadata";
//import { paymentController } from "../controllers/paymentControllers";
import { clientToken } from "../middlewares/checkJWT";
import { InternalServerError, NotFoundError } from "../errors/InstancesCE";
import { DbUtils } from "../utils/DbUtils";
import { User_Profile } from "../entity/User_Profile";
import { Payment } from "../entity/Payment";
import {Admin} from "../entity/Admin";

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
        return res.status(409).json({status:false, message: 'User is not registered with us, please try another'});
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

    const Payment1=await connection.manager.save(payment);

    console.log("UserId imageUpload:", payment.User_Id.User_Id);
if(Payment1){
    return res.status(200).json({ status: true,message:"Data Upload Successfully" });
}
return res.status(409).json({status:false,message:"Data not uploaded"});

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
        return res.status(409).json({ status:false,message: 'User is not registered with us, please try another'});
    }
    
    // const payment = await connection
    //   .getRepository(Payment)
    //   .createQueryBuilder()
    //   .orderBy("Payment_Time_Date", "DESC")
    //   .where({ User_Id: user_id, Is_DebitCredit: false })
    //   .excludeSelect('Payment_Image')
    //   .take(50).getRawMany();

      const payment = await connection
      .getRepository(Payment, "payment")
      .createQueryBuilder()
      .select("payment.Payment_Id")
      .addSelect("payment.userIdUserId")
      .addSelect("payment.Is_DebitCredit")
      .addSelect("payment.Payment_Time_Date")
      .addSelect("payment.Payment_Amount")
      .addSelect("payment.Status")
      .addSelect("payment.Remark")
      .orderBy("Payment_Time_Date", "DESC")
      .where({ User_Id: user_id, Is_DebitCredit: false })
      .take(50)
      .getRawMany();

      // const payment = await connection
      // .getRepository(Payment)
      // .createQueryBuilder()
      // .select([
      //   'DISTINCT payment.Payment_Id"Payment_Id"',
      //   'payment.User_Id"User_Id"',
      //   'payment.Is_DebitCredit"Is_DebitCredit"',
      //   'payment.Payment_Amount"Payment_Amount"',
      //   'payment.Payment_Time_Date"Payment_Time_Date"',
      //   'payment.Status"Status"',
      //   'payment.Remark"Remark"',
      // ])
      // .from(Payment, "payment")
      // .orderBy("Payment_Time_Date", "DESC")
      // .where({ User_Id: user_id, Is_DebitCredit: false })
      // .take(50).getRawMany();
      
    

    //  // let data = await connection.getRepository(Payment).find({User_Id:user_id,Is_DebitCredit:false}).limit(1).sort({Payment_Time_Date: -1})
    //   const data1=await connection.createQueryBuilder()
    //     .select()
    //     .from(Payment, "payment")
    //     .where("payment.userIdUserId=1");
    //   if(data1){
    //     return res.status(200).json(data1);
    //   }
    //console.log(payment[0]["Payment_Payment_Id"]);
    if (payment) {
      return res.status(200).json({status:true,payment});
    }
    return res.status(404).json({status:false,message:"Data not found"});
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function withdrawMoney(req, res, next) {
  console.log("POST /api/withdrawMoney API call made");
  const { user_id, upi_id, withdraw_amount } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(User_Profile, { where: { User_Id: user_id } });
    if(!exists) {
        return res.status(409).json({status:false, message: 'User is not registered with us, please try another'});
    }
    const data = await connection.getRepository(User_Profile)
    .createQueryBuilder()
    .update(User_Profile)
    .set({ 
      User_UPI_Id:upi_id
    })
    .where("User_Id = :id", { id: user_id })
    .execute();

    let payment = new Payment();
    payment.User_Id = await connection.manager.findOne(User_Profile, {
      where: { User_Id: user_id },
    });
    payment.Is_DebitCredit = true;

    console.log("withdrawMoney debit:", payment.Is_DebitCredit);

    payment.Payment_Amount = withdraw_amount;
    payment.Payment_Image = "null";
    payment.Remark = "";
    payment.Status = 2;

    const data1=await connection.manager.save(payment);

    console.log("withdrawMoney:", payment.User_Id.User_Id);
    if(data1){
      return res.status(200).json({ status: true,message:"Data Upload Successfully" });
  }
  return res.status(409).json({status:false,message:"Data not uploaded"});
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
                    return res.status(409).json({ status:false,message: 'User is not registered with us, please try another'});
                }
    // const payment = await connection.manager
    //   .find(Payment, {
    //     where: { User_Id: user_id, Is_DebitCredit: true },
    //   })
    //   .limit(50)
    //   .sort({ Payment_Time_Date: -1 });

    // const payment = await connection
    // .getRepository(Payment)
    // .createQueryBuilder()
    // .select()
    // .orderBy("Payment_Time_Date", "DESC")
    // .where({ User_Id: user_id, Is_DebitCredit: true })
    // .take(50).getRawMany();

    const payment = await connection
      .getRepository(Payment, "payment")
      .createQueryBuilder()
      .select("payment.Payment_Id")
      .addSelect("payment.userIdUserId")
      .addSelect("payment.Is_DebitCredit")
      .addSelect("payment.Payment_Time_Date")
      .addSelect("payment.Payment_Amount")
      .addSelect("payment.Status")
      .addSelect("payment.Remark")
      .orderBy("Payment_Time_Date", "DESC")
      .where({ User_Id: user_id, Is_DebitCredit: true })
      .take(50)
      .getRawMany();

    if (payment) {
      return res.status(200).json({status:true,payment});
    }
    return res.status(404).json({status:false,message:"Data not found"});
  } catch (error) {
    console.log(error);
    throw new InternalServerError();
  }
}

async function getUPIId(req, res, next) {
  console.log("POST /api/getUPIId API call made");
  const { admin_id } = req.body;
  try {
    const connection = await DbUtils.getConnection();
    const exists = await connection.manager.findOne(Admin, { where: { Admin_Id: admin_id } });
    if(!exists) {
        return res.status(409).json({status:false, message: 'User is not registered with us, please try another'});
    }
  
if(exists.Admin_UPI_Id == null){
  return res.status(404).json({status:false,message:"Data not found"});
}
    if (exists) {
      return res.status(200).json({
        status:true,
        admin_upi_id: exists.Admin_UPI_Id,
      });
    }
    return res.status(404).json({status:false,message:"Data not found"});
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
