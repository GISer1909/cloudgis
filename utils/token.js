
const jwt = require('jsonwebtoken');
const secret = 'cloudgis'; // 密钥，不能丢
const expiresIn = 1000 * 60 * 60 * 1; // 过期时间，单位毫秒,这里设置为1小时
function createToken(payload) {
    return jwt.sign(payload, secret, { expiresIn });
}
function verifyToken(token) {
   //封装一个返回promise对象的方法
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, data) => {
            if (err) reject(err);
            resolve(data);
        });
    });
}

module.exports = {
    createToken,
    verifyToken
};