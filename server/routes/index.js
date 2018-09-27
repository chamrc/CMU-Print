const express = require('express');
const router = express.Router();
const exec = require('child_process').exec;
const multer = require('multer');
const PrintTicket = require('../models/PrintTicket');

if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ?
				args[number] :
				match;
		});
	};
}

const UPLOAD_DIR = 'uploads';
const URL_FORMAT = 'https://print.rcz.io/' + UPLOAD_DIR + '/{0}';

var upload = multer({
	dest: 'public/{0}/'.format(UPLOAD_DIR)
});

/* GET home page. */
router.get('/', function(req, res, next) {
	var io = req.app.get('io');
	io.emit('new_doc', {
		filename: 'sample.pdf',
		url: 'google.com',
		options: ''
	});
	res.render('index', {});
});

router.post('/print', upload.single('file'), (req, res, next) => {
	if (req.body.id === "") {
		res.render('error', {
			message: 'Please enter your Andrew ID.'
		});
		return;
	} else if (req.file == null) { // undefined or null
		res.render('error', {
			message: 'Please send a file to print.'
		});
		return;
	}

	//  0: Andrew ID,
	//  1: Printer,
	//  2: Number of Copies,
	//  3: Page Range,
	//  4: Orientation,
	//  5: Side
	var options = '-U {0} -d {1} -n {2}{3}{4} -o {5}'.format(
		req.body.id,
		req.body.printer,
		req.body.num_copies,
		req.body.range === '' ? '' : ' -o "{0}"'.format(req.body.range),
		req.body.orientation == '' ? '' : ' -o {0}'.format(req.body.orientation),
		req.body.sides
	);

	// 	{
	// 		fieldname: 'file',
	// 		originalname: 'document.pdf',
	// 		encoding: '7bit',
	// 		mimetype: 'application/pdf',
	// 		destination: 'public/uploads/',
	// 		filename: '6a093e171a08b28f670a7949c4749f85',
	// 		path: 'public/uploads/6a093e171a08b28f670a7949c4749f85',
	// 		size: 433994
	// 	}
	const filename = req.file.originalname;
	const filepath = req.file.path;
	const fileurl = URL_FORMAT.format(req.file.filename);

	PrintTicket.create({
		filename,
		filepath,
		fileurl,
		options
	}, (err, ticket) => {
		var io = req.app.get('io');
		if (err || ticket == null) {
			res.render('error', {
				message: 'Failed to create a print ticket.'
			});
		} else if (io.engine.clientsCount === 0) {
			res.render('error', {
				message: 'Added to Queue!',
				content: 'Successfully added a print ticket. No worker is currently online, will get it processed as soon as possible.'
			});
		} else {
			io.emit('new_ticket', {
				id: ticket._id.toString(),
				filename,
				fileurl,
				options
			});
			res.render('error', {
				message: 'Success!',
				content: 'Successfully added a print ticket. The worker is working on your ticket now.'
			});
		}
	});
});

module.exports = router;
