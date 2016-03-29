var bcrypt = require('bcryptjs');
var _ = require('underscore');
var cryptojs = require('crypto-js');
var jsonWebToken = require('jsonwebtoken');

module.exports = function (sequelize, DataTypes) {
	//
	var user = sequelize.define('user', {
	    email: {
	        type: DataTypes.STRING,
	        allowNull: false,
	        unique: true,
	        validate: {
	        	isEmail: true
	        }
	    },
	    salt: {
	    	type: DataTypes.STRING
	    },
	    password_hash: {
	    	type: DataTypes.STRING
	    },
	    password: {
	        type: DataTypes.VIRTUAL,
	        allowNull: false,
	        validate: {
	        	len: [4,100]
	        },
	        set: function (value) {
	        	var salt = bcrypt.genSaltSync(10);
	        	var hashedPassword = bcrypt.hashSync(value, salt);

	        	this.setDataValue('password', value);
	        	this.setDataValue('salt', salt);
	        	this.setDataValue('password_hash', hashedPassword);
	        }
	    }
	}, {
		hooks: {
			beforeValidate: function(user, options) {
				if (typeof user.email === 'string') {
					user.email = user.email.toLowerCase();
				}
			}
		},
		classMethods: {
			authenticate: function(body) {
				return new Promise(function(resolve, reject) {
					if (typeof body.email !== 'string' || typeof body.password !== 'string') {
						return reject();
					}

					user.findOne({
						where: {
							email: body.email
						}
					}).then(function(user) {
						if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
							return reject();
						}
						resolve(user);
						//response.json(user.toPublicJSON());

					}, function(e) {
						reject();
					});
				});
			}
		},
		instanceMethods: {
			toPublicJSON: function () {
				var json = this.toJSON();
				return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
			},
			generateToken: function (type) {
				// create a new, unique and encrypted token to be returned back to the user

				if (!_.isString(type)) {
					return undefined;
				}

				try {
					// encrypt user info and create new json web token.
					// first: get user ID and Token Type and convert them to a string.
					var stringData = JSON.stringify({id: this.get('id'), type: type});
					// encrypt the stringified user data.
					var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!#').toString();
					var token = jsonWebToken.sign({
						token: encryptedData
					}, 'randomstring099');
					// return the encrypted user data.
					return token;
				} catch (e) {
					//
					console.error(e);
					return undefined;
				}
			}
		}
	});

	return user;
};