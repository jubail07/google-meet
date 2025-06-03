const JWT = require('jsonwebtoken')

module.exports = (user)=>{
    return JWT.sign(
        {
            id:user.id,
            username:user.username
        },'secret'
    )
}