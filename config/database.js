const mongoose = require('mongoose')

exports.connectDB = async () => {
    try {
        await mongoose.connect(process.env.DB)
        console.log('connected to db')
    } catch (error) {
        console.log('error in database')
    }
}