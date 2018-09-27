const bcrypt = require('bcrypt');
const User = require('../models/User');

function config(io) {
	require('socketio-auth')(io, {
		authenticate: (socket, data, callback) => {
			var username = data.username;
			var password = data.password;

			User.findOne({
				username
			}, (err, user) => {
				if (err || !user) return callback(new Error("User not found"));
				return callback(null, bcrypt.compareSync(password, user.password));
			});
		}
	});
}

module.exports = config
