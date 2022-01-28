const jwt = require('jsonwebtoken');

// create a normal function:

function generateAccessToken(username) {
  return jwt.sign({username}, process.env.TOKEN_SECRET, { expiresIn: '1d' });
}

module.exports = {
	generateAccessToken
}