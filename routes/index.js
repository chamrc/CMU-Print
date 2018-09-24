var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var multer = require('multer');
var upload = multer({
	dest: 'uploads/'
});

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

const FORMAT = 'lpadmin -p "{0}" -v lpd://{0}@printing.andrew.cmu.edu/andrew -P public/CMUGeneric.ppd; cupsenable {0}; cupsaccept {0}; lp -d "{0}" -t "{1}" {2}';
const SUCCESS = 'Printed file \'{1}\' for Andrew ID \'{0}\'! '
const FAILURE = 'Error printing file: {0}'
const REMOVE = 'rm "{0}"'

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {});
});

/*
{
  "fieldname": "file",
  "originalname": "resume.pdf",
  "encoding": "7bit",
  "mimetype": "application/pdf",
  "destination": "uploads/",
  "filename": "e1aded3c4dbab99bd9091e5125343572",
  "path": "uploads/e1aded3c4dbab99bd9091e5125343572",
  "size": 95914
}
 */
router.post('/print', upload.single('file'), (req, res, next) => {
	if (req.body.id === "") {
		res.send("Please enter your Andrew ID.");
		return;
	} else if (req.file == null) { // undefined or null
		res.send("Please send a file to print.");
		return;
	}

	var cmd = FORMAT.format(req.body.id, req.file.originalname, req.file.path);
	exec(cmd, (err, out, code) => {
		if (!err && code == 0) {
			msg = SUCCESS.format(req.body.id, req.file.originalname);

			console.log(msg);
			res.writeHead(200, {
				'Content-Type': 'application/json'
			});
			res.write(JSON.stringify({
				status: 'true',
				id: req.body.id,
				filename: req.file.originalname,
				message: msg
			}));
			res.end();
		} else {
			msg = FAILURE.format(err);

			console.log(msg);
			res.writeHead(400, {
				'Content-Type': 'application/json'
			});
			res.write(JSON.stringify({
				status: 'false',
				err: err,
				message: msg
			}));
			res.end();
		}

		cmd = REMOVE.format(req.file.path);
		exec(cmd, (err, out, code) => {
			if (!err && code == 0) {
				console.log('Deleted file "{0}"'.format(req.file.path));
			} else {
				console.log('Error deleting file "{0}"'.format(req.file.path));
			}
		});
	});
});

module.exports = router;
