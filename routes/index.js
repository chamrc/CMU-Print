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

const FORMAT = 'sudo lpadmin -p "{0}" -v lpd://{0}@printing.andrew.cmu.edu/andrew -P public/CMUGeneric.ppd; sudo cupsenable {0}; sudo cupsaccept {0}; sudo lp -d "{0}" -t "{1}" {2}';
const SUCCESS = 'Printed file \'{1}\' for Andrew ID \'{0}\'! '
const FAILURE = 'Error printing file: {0}'
const REMOVE = 'rm "{0}"'

/* GET home page. */
router.get('/', function(req, res, next) {
	res.render('index', {});
});

router.post('/print', (req, res, next) => {
	console.log(req.body);
	if (req.body.id === "") {
		res.send("Please enter your Andrew ID.");
		return;
	}

	/*
	 * 0: Andrew ID,
	 * 1: Printer,
	 * 2: Number of Copies,
	 * 3: Page Range,
	 * 4: Orientation,
	 * 5: Side
	 */
	options = '-U {0} -d {1} -n {2}{3}{4} -o {5}'.format(
		req.body.id,
		req.body.printer,
		req.body.num_copies,
		req.body.range === '' ? '' : ' -o "{0}"'.format(req.body.range),
		req.body.orientation == '' ? '' : ' -o {0}'.format(req.body.orientation),
		req.body.sides
	);

	res.render('print', {
		address: 'cmu.print@aol.com',
		title: 'New Print Query',
		body: options
	})
});

// router.post('/print', upload.single('file'), (req, res, next) => {
// 	if (req.body.id === "") {
// 		res.send("Please enter your Andrew ID.");
// 		return;
// 	} else if (req.file == null) { // undefined or null
// 		res.send("Please send a file to print.");
// 		return;
// 	}

// 	var cmd = FORMAT.format(req.body.id, req.file.originalname, req.file.path);
// 	exec(cmd, (err, out, code) => {
// 		if (!err && code == 0) {
// 			msg = SUCCESS.format(req.body.id, req.file.originalname);

// 			console.log(msg);
// 			res.writeHead(200, {
// 				'Content-Type': 'application/json'
// 			});
// 			res.write(JSON.stringify({
// 				status: 'true',
// 				id: req.body.id,
// 				filename: req.file.originalname,
// 				message: msg
// 			}));
// 			res.end();
// 		} else {
// 			msg = FAILURE.format(err);

// 			console.log(msg);
// 			res.writeHead(400, {
// 				'Content-Type': 'application/json'
// 			});
// 			res.write(JSON.stringify({
// 				status: 'false',
// 				err: err,
// 				message: msg
// 			}));
// 			res.end();
// 		}

// 		cmd = REMOVE.format(req.file.path);
// 		exec(cmd, (err, out, code) => {
// 			if (!err && code == 0) {
// 				console.log('Deleted file "{0}"'.format(req.file.path));
// 			} else {
// 				console.log('Error deleting file "{0}"'.format(req.file.path));
// 			}
// 		});
// 	});
// });

module.exports = router;
