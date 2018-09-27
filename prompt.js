const readline = require('readline');

const ask = (rl, question) => {
	return new Promise(resolve => {
		rl.question(question, (answer) => {
			resolve(answer);
		});
	});
}

const prompt = function(questions) {
	return new Promise(async resolve => {
		let rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout
		});

		let results = [];
		for (let i = 0; i < questions.length; i++) {
			const result = await ask(rl, questions[i]);
			results.push(result);
		}
		rl.close();
		resolve(results);
	})
}

module.exports = prompt;
