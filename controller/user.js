
exports.getHome = async (req, res) => {
    try {
        const user = req.user.username
        return res.render('user/home',{user})
    } catch (error) {
        console.log(error, 'error in getHome')
    }
}

exports.logout = async(req, res)=>{
    try {
        return res.clearCookie('userToken').redirect('/login')
    } catch (error) {
        console.log(error, 'error in logout')
    }
}