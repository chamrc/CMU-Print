var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PrintTicketSchema = new Schema({
	filename: {
		type: String,
		required: true
	},
	filepath: {
		type: String,
		required: true
	},
	fileurl: {
		type: String,
		required: true
	},
	completed: {
		type: Boolean,
		required: true,
		default: false,
		index: true
	},
	options: {
		type: String,
		required: true
	}
});

var PrintTicket = mongoose.model('PrintTicket', PrintTicketSchema);

module.exports = PrintTicket;
