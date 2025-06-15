import { HttpStatusCode } from "../../utils/http-status-code";


export class DataResponse<T> {
    readonly success: boolean;
    readonly code: HttpStatusCode;
    readonly data?: T;
    readonly message: string;
    readonly errors: string;
    
    constructor(
        success: boolean,
        code: HttpStatusCode,
        data?: T,
        message: string = '',
        errors: string = ''
    ) {
        this.success = success;
        this.code = code;
        this.data = data;
        this.message = message;
        this.errors = errors;
    }
    static success<T>(data: T, message: string): DataResponse<T> {
        return new DataResponse<T>(true, HttpStatusCode.OK, data, message);
    }

    static error<T>(code: HttpStatusCode, message: string, errors: string): DataResponse<T> {
        return new DataResponse<T>(false, code, undefined, message, errors);
    }

    static notFound<T>(message: string = 'Not Found'): DataResponse<T> {
        return new DataResponse<T>(false, HttpStatusCode.NOT_FOUND, undefined, message);
    }
    static badRequest<T>(message: string = 'Bad Request', errors: string = ''): DataResponse<T> {
        return new DataResponse<T>(false, HttpStatusCode.BAD_REQUEST, undefined, message, errors);
    }
    static unauthorized<T>(message: string = 'Unauthorized'): DataResponse<T> {
        return new DataResponse<T>(false, HttpStatusCode.UNAUTHORIZED, undefined, message);
    }
    static forbidden<T>(message: string = 'Forbidden'): DataResponse<T> {
        return new DataResponse<T>(false, HttpStatusCode.FORBIDDEN, undefined, message);
    }

}