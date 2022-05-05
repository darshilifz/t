import { CustomError } from './CustomError';


export class InternalServerError extends CustomError{
    statusCode = 500
    message: 'Internal Server Error:Something went wrong'
    constructor(){
        super('Internal Server Error')

        Object.setPrototypeOf(this, InternalServerError.prototype)
    }
    serializeErrors(){
        return [{message:this.message}]
    }
}

export class Unauthorized extends CustomError{
    statusCode = 401
    message = 'Unauthorized: Access Denied'
    constructor(){
        super('Unauthorized attempt')

        Object.setPrototypeOf(this, Unauthorized.prototype)
    }
    serializeErrors(){
        return [{message:this.message}]
    }
}

export class NotFoundError extends CustomError{
    statusCode = 404
    msg = 'Resource not found:Check Your Input'
    constructor(message:string){
        super('Not Found')
        this.msg = message
        Object.setPrototypeOf(this, NotFoundError.prototype)
    }
    serializeErrors(){
        return [{message:this.msg}]
    }
}
