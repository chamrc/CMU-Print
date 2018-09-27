var socket = require('socket.io-client')('http://localhost:3000')

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
});
