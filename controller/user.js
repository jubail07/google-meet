

exports.getHome = async (req, res) => {
    try {
        return res.render('user/home')
    } catch (error) {
        console.log(error, 'error in getHome')
    }
}