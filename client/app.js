const host;

if (process.env.ENV === 'dev') {
	host = 'http://localhost:3000';
} else {
	host = 'https://print.rcz.io'
}

const socket = require('socket.io-client')(host)

const username = process.env.USERNAME || 'admin';
const password = process.env.PASSWD;
if (password == null) {
	console.log('Password is required to communicate with server.');
	process.exit(-1);
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

	// socket.emit('completed_ticket', {
	// 	id: data.id
	// });
});
