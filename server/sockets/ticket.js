const fs = require('fs');
const debug = require('debug')('cmu-print:server');
const ObjectId = require('mongoose').Types.ObjectId;
const PrintTicket = require('../models/PrintTicket');

function ticket(socket) {
	socket.on('completed_ticket', (data) => {
		if (!data.id) return;

		var _id = ObjectId(data.id);

		PrintTicket.findOneAndUpdate({
			_id
		}, {
			completed: true
		}, (err, ticket) => {
			if (err || !ticket) {
				debug(err);
				return;
			}

			fs.unlink(ticket.filepath, (err) => {
				if (err) {
					debug(err);
					return;
				}
			});

			console.log(ticket);
		});
	});
}

module.exports = ticket
