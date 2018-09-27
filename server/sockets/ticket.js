const fs = require('fs');
const debug = require('debug')('cmu-print:server');
const ObjectId = require('mongoose').Types.ObjectId;
const PrintTicket = require('../models/PrintTicket');

function ticket(io, socket) {
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

	// Check for unfinished print tickets
	PrintTicket.find({
		completed: false
	}, (err, tickets) => {
		if (!tickets) return;
		tickets.forEach((ticket) => {
			socket.emit('new_ticket', {
				id: ticket._id.toString(),
				filename: ticket.filename,
				fileurl: ticket.fileurl,
				options: ticket.options
			});
		});
	});
}

module.exports = ticket
