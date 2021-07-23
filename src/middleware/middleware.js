const jwt = require('jsonwebtoken');

const { jwtSecret } = require("../config");

module.exports = {
    isLoggedIn(req, res, next) {
        try {
            const token = typeof req.headers.authorization != 'undefined' ? req.headers.authorization.split(" ")[1] : 'undefined';
            //const token = req.headers.authorization?.split(' ')[1];
            const decodedToken = jwt.verify(token, jwtSecret);
            req.user_from_token = decodedToken;
            if (req.body.author_id === decodedToken.id) {
                return next();
            }
            else {
                return res.status(400).send({ error: 'Unauthorized access to site.' });
            }
            
        } catch (e) {
            return res.status(400).send({ error: 'Unauthorized access to site.' });
        }
    },
};