const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const exec = require('child_process').exec;
const mkdirp = require('mkdirp');

var HOST, SLEEP_TIME;
const isDev = process.env.ENV === 'dev';
if (isDev) {
	HOST = 'http://localhost:3000';
	SLEEP_TIME = 10000; // 10 seconds: 10 * 1000
} else {
	HOST = 'https://print.rcz.io';
	SLEEP_TIME = 600000; // 10 minutes: 10 * 60 * 1000
}
const FILE_FORMAT = 'downloads/{0}';
const COMMAND_FORMAT = 'lp {0} -t "{1}" {2}'

const socket = require('socket.io-client')(HOST)

const username = process.env.USERNAME || 'admin';
const password = process.env.PASSWD;
if (password == null) {
	console.log('Password is required to communicate with server.');
	process.exit(-1);
}

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

socket.on('authenticated', function() {
	console.log('Authenticated');
});

socket.on('connect', () => {
	console.log('Connected');

	socket.emit('authentication', {
		username,
		password
	});
});

socket.on('disconnect', function() {
	console.log('Disconnected');
});

socket.on('new_ticket', (data) => {
	console.log(JSON.stringify(data, null, 4));

	print(data).catch((err) => {
		console.log(err);
	});
});

function print({
	id,
	filename,
	fileurl,
	options
}) {
	return new Promise((resolve, reject) => {
		var filelink = HOST + fileurl;
		var destfile = FILE_FORMAT.format(id);

		download(filelink, destfile).then(() => {
			var command = COMMAND_FORMAT.format(options, filename, destfile);
			return run(command);
		}).then(() => {
			socket.emit('completed_ticket', {
				id
			});
			return rm(destfile);
		}).catch((err) => {
			reject(err);
		});
	});
}

function download(fileurl, filepath) {
	return new Promise((resolve, reject) => {
		mkdirp(path.dirname(filepath), (err) => {
			if (err) {
				reject(err);
				return;
			}

			var file = fs.createWriteStream(filepath);
			var HTTP = isDev ? http : https;
			var req = https.get(fileurl, function(res) {
				res.pipe(file);
				file.on('finish', function() {
					file.close(() => {
						resolve();
					});
				});
			}).on('error', function(err) { // Handle errors
				fs.unlink(dest);
				reject(err);
			});
		});
	});
}

const SUCCESS = 'Success: \'{0}\'! '
const FAILURE = 'Error  : \'{0}\'! '

function run(command) {
	return new Promise((resolve, reject) => {
		exec(command, (err, out, code) => {
			if (!err && code == 0) {
				msg = SUCCESS.format(command);
				console.log(msg);
				resolve();
			} else {
				msg = FAILURE.format(command);
				console.log(msg);
				reject(err);
			}
		});
	});
}

function rm(filepath) {
	return new Promise((resolve, reject) => {
		fs.unlink(filepath, (err) => {
			if (err) {
				reject(filepath);
			} else {
				resolve();
			}
		});
	});
}
