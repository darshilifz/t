import {Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import config from "../config/config";
import { Auth } from "../entity/Auth";
import { NotFoundError, Unauthorized } from "../errors/InstancesCE";
import { DbUtils } from "../utils/DbUtils";



export const checkJwtToken = (req:Request,res:Response, next:NextFunction) =>{
    let token = req.headers.authorization.split(' ')[1];
    if(token){
        jwt.verify(token, config.jwtSecret, async (error, decoded)=>{
            if(error){
                throw new NotFoundError(error.message)
            }else{
                console.log(decoded);
                next();
            }
        })
    }else{
        throw new Unauthorized();
    }
}

export const clientToken = async (req: Request, res:Response, next:NextFunction) => {
        const connection = await DbUtils.getConnection();
        let auth_header = req.headers.authorization || '0 0';
        let userid = auth_header.split(' ')[0];
        let token = auth_header.split(' ')[1];
        const tokendata = await connection.manager.findOne(Auth, { where: { User_Id: userid, Jwt_Token: token } });
        if(tokendata){
           return next();
        }else{
            throw new Unauthorized();
        }

}

