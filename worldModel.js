const Promise = require('bluebird');

class WorldModel {
	async init() {
	}

	async waitOnConnect() {
		await Promise.delay(20000); // some random delay ensuring that the services are up and running
	}

	async environmentCheck() {
	}
	
	async tearDown() {
	}
}


module.exports = WorldModel;
