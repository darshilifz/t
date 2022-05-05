import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../errors/CustomError'

export const errorHandler = async (err: Error, req:Request, res:Response, next:NextFunction) => {
    console.log("SOMETHING WENT WRONG")
    console.log(err);

    if (err instanceof CustomError) {
        return res.status(err.statusCode).send({errors: err.serializeErrors()})
    } else {
        res.status(400).send({
            errors: [{message: 'Something Went Wrong'}]
        })
    }
}