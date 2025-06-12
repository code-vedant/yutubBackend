class apiError extends Error {
    constructor(
        statusCode,
        message= "Something went wrong",
        errors = [],
    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors
    }
}

export { apiError }

// class apiResponse {
//     constructor(statusCode, data, message = "Success"){
//         this.statusCode = statusCode
//         this.data = data
//         this.message = message
//         this.success = statusCode < 400
//     }
// }

// export { apiResponse }

