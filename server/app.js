const createError = require('http-errors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const debug = require('debug')('cmu-print:server');
const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const bcrypt = require('bcrypt');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const auth = require('./sockets/auth');
const ticket = require('./sockets/ticket');

const prompt = require('./prompt');
const User = require('./models/User');

const isDev = process.env.ENV == 'dev';

initDB()
	.then(initApp)
	.then(initIO)
	.then(configApp)
	.then(configIO)
	.then(startServer)
	.catch((err) => {
		console.log(err);
	});

function initDB() {
	return new Promise((resolve, reject) => {
		if (isDev) mongoose.connect('mongodb://127.0.0.1/cmu-print-dev', {
			useNewUrlParser: true
		});
		else mongoose.connect('mongodb://127.0.0.1/cmu-print', {
			useNewUrlParser: true
		});

		var db = mongoose.connection;
		mongoose.Promise = global.Promise;
		db.on('error', (err) => {
			reject(err);
		});

		User.findOne().exec((err, user) => {
			if (user == null) {
				console.log('NO USER');
				prompt([
					'Please enter username for admin: ',
					'Please enter password for admin: '
				]).then(([username, password]) => {
					User.create({
						username,
						password: bcrypt.hashSync(password, 10)
					}, (err, user) => {
						if (user == null) reject(err);
						else resolve(db);
					});
				});
			} else {
				if (err) reject(err);
				else resolve(db);
			}
		});
	});
}

function initApp(db) {
	var app = express();
	var server;
	if (isDev) {
		server = http.createServer(app);
	} else {
		const prefix = '/home/ubuntu/certificates/config/live/print.rcz.io/'
		const privateKey = fs.readFileSync(prefix + 'privkey.pem', 'utf8');
		const certificate = fs.readFileSync(prefix + 'cert.pem', 'utf8');
		const ca = fs.readFileSync(prefix + 'chain.pem', 'utf8');

		server = https.createServer({
			key: privateKey,
			cert: certificate,
			ca: ca
		}, app);
	}

	return [db, server, app];
}

function initIO([db, server, app]) {
	var io = require('socket.io')(server);
	app.set('io', io);
	return [db, server, app, io];
}

function configApp([db, server, app, io]) {
	app.set('host', 'print.rcz.io');

	// view engine setup
	app.set('views', path.join(__dirname, 'views'));
	app.set('view engine', 'jade');

	app.use(logger('dev'));
	app.use(express.json());
	app.use(express.urlencoded({
		extended: false
	}));
	app.use(cookieParser());
	app.use(express.static(__dirname + '/node_modules/bootstrap/dist'));
	app.use(express.static(path.join(__dirname, 'public')));

	app.disable('etag');
	app.use('/', indexRouter);

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
		next(createError(404));
	});

	// error handler
	app.use(function(err, req, res, next) {
		// set locals, only providing error in development
		res.locals.message = err.message;
		res.locals.error = req.app.get('env') === 'development' ? err : {};

		// render the error page
		res.status(err.status || 500);
		res.render('error');
	});

	return [db, server, app, io];
}

function configIO([db, server, app, io]) {
	auth(io);

	io.on('connect', (socket) => {
		ticket(socket);
	});

	return [db, server, app, io];
}

function startServer([db, server, app, io]) {
	var port = normalizePort(process.env.PORT || '3000');
	app.set('port', port);

	server.listen(port);
	server.on('error', onError);
	server.on('listening', onListening(server));
}

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	var port = parseInt(val, 10);

	if (isNaN(port)) return val;
	if (port >= 0) return port;
	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') {
		throw error;
	}

	var bind = typeof port === 'string' ?
		'Pipe ' + port :
		'Port ' + port;

	// handle specific listen errors with friendly messages
	switch (error.code) {
		case 'EACCES':
			console.error(bind + ' requires elevated privileges');
			process.exit(1);
			break;
		case 'EADDRINUSE':
			console.error(bind + ' is already in use');
			process.exit(1);
			break;
		default:
			throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening(server) {
	return () => {
		var addr = server.address();
		var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
		debug('Listening on ' + bind);
	}
}
