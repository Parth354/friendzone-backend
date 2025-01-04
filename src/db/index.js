import { DB_NAME } from "../constants.js"
import { mongoose } from "mongoose"

const connectDB = async () => {
    try {
        const url = `${process.env.MONGO_URI}/${DB_NAME}`
        console.log(`Connecting too ${url}`)
        const instance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`Connected to ${instance.connection.host}`)
    }catch(error){
        console.log(`Error: ${error.message}`)
        process.exit(1)
    }
}
export default connectDB