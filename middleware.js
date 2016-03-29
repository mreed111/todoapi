module.exports = function (db) {
	//
	return {
		//
		requireAuthentication: function (request, response, next) {
			// pull the Auth token header out of the request object.
			var token = request.get('Auth');

			db.user.findByToken(token).then(function (user) {
				// add the located user to the request object and 
				// continue to the private code.
				request.user = user;
				next();
			}, function () {
				response.status(401).send();
				// not calling next() stops the process here.
				// controll will not pass to the private code.
			});
		}
	};
};