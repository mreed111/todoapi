var cryptojs = require('crypto-js');

module.exports = function (db) {
	//
	return {
		//
		requireAuthentication: function (request, response, next) {
			// pull the Auth token header out of the request object.
			var token = request.get('Auth') || '';
			console.log('...Auth token:  '+ token);
			// look in the db for a token whos hashed value matches the hash value of 
			// the 'Auth' header setting.  This value will exist in the db only if the
			// user is logged in.
			console.log('...Searching db.tokens hash = ' + cryptojs.MD5(token).toString());
			db.token.findOne({
				where: {
					tokenHash: cryptojs.MD5(token).toString()
				}

			}).then(function (tokenInstance) {
				// this code is entered only when the search succeeds, i.e. the user is logged in.
				if (!tokenInstance) {
					// no token on the request.  
					console.log('no token found ...');
					throw new Error();
				}

				request.token = tokenInstance;
				return db.user.findByToken(token);

			}).then(function (user) {
				// token was found.  User data of the logged in user was returned.
				request.user = user;
				next();

			}).catch(function () {
				console.lo
				response.status(401).send();
			});

		}
	};
};