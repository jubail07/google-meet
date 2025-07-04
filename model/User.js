const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
    username: String,
    password: String
})

userSchema.pre('save', async function (next) {
    if (!this.isModified('password'))
        return next()

    this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.validatePassword = async function (userPassword) {
    return await bcrypt.compare(userPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)