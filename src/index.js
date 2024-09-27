// require('dotenv').config({path: './env'})
import dotenv from 'dotenv'
import connectDB from './db/index.db.js'
import {app} from './app.js'

dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(` Server is running ,DB connected successfully`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})










// const app = express();

// ( async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//         app.on('error', (error)=> {
//             console.log("Error",error);
//         })

//         app.listen(process.env.PORT , () => {
//             console.log(`App is listening on ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.log("eror : " , error);
//     }
// })()