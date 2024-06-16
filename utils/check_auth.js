function checkAuth(req, res, isAdmin, isSelf) {
    try {
        let body = req.body;
        if (isAdmin && req.user.role !== 1) {
            return res.json({
                code: 403,
                message: '权限不足'
            });
        }
        if (isSelf && req.user.id !== body.id) {
            return res.json({
                code: 403,
                message: '权限不足'
            });
        }
        return true;
    } catch (error) {
        return res.json({
            code: 500,
            message: '服务器错误'
        });
    }

}
module.exports = {
    checkAuth
}