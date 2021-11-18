/* Libraries */
const express = require('express');
const https = require('https');
const http = require('http');
const helmet = require('helmet');
const fs = require('fs');
const cors = require('cors');
const winston = require('winston');
const expressWinston = require('express-winston');
const bodyParser = require('body-parser');
const axios = require('axios');

const logger = require('./includes/logging/main');
const config = require('./config');
const cache = require('./includes/cache/main');
const calls = require('.//includes/database/calls');

/* Create server */
const app = express();

/* Helmet security policies */
app.use(helmet.contentSecurityPolicy());
app.use(helmet.dnsPrefetchControl());
app.use(helmet.expectCt());
app.use(helmet.frameguard());
app.use(helmet.hidePoweredBy());
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.xssFilter());

/* CORS */
if (config.server.cors.enabled) {
	const corsOptions = {
		origin: config.server.cors.origin,
		optionsSuccessStatus: 200,
	};
	app.use(cors(corsOptions));
}

/* Add body parser */
app.use(
	bodyParser.urlencoded({
		extended: true,
	})
);
app.use(bodyParser.json());

/* Logger */
app.use(
	expressWinston.logger({
		transports: [new winston.transports.Console()],
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.json()
		),
		meta: true,
		msg: '{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}',
		colorize: true,
		ignoreRoute: function (req, res) {
			return false;
		}, // optional: allows to skip some log messages based on request and/or response
	})
);

/* HTTP Server */
if (config.server.http.enabled) {
	logger.info('Starting HTTP server');
	const httpServer = http.createServer(app);
	httpServer.listen(config.server.http.port, () => {
		logger.info('HTTP server started on port ' + config.server.http.port);
	});

	/* Error processing */
	httpServer.on('error', (e) => {
		if (e.code === 'EADDRINUSE') {
			logger.info(
				'Port (' +
					config.server.http.port +
					') is already in use - please pick a new HTTP port'
			);
		} else {
			logger.info('Unknown error - Failed to start web server');
		}
	});
}

/* HTTPS server */
if (config.server.https.enabled) {
	const credentials = {
		key: fs.readFileSync(config.server.https.key),
		cert: fs.readFileSync(config.server.https.cert),
	};

	app.use(helmet.hsts());
	const httpsServer = https.createServer(credentials, app);
	httpsServer.listen(config.server.https.port, () => {
		logger.info('HTTP server started on port ' + config.server.https.port);
	});

	/* Error processing */
	httpsServer.on('error', (e) => {
		if (e.code === 'EADDRINUSE') {
			logger.info(
				'Port (' +
					config.server.https.port +
					') is already in use - please pick a new HTTPS port'
			);
		} else {
			logger.info('Unknown error - Failed to start web server');
		}
	});
}

/* Update DB / Pull from DB */
const updateDBTimer = () => {
	updateDB();
	setInterval(() => {
		updateDB();
	}, config.database.refreshRate);
};

const updateDB = () => {
	console.log(cache.doorData);
	// Update providers
	let promiseProviders = [];
	let promiseDoors = [];
	let promiseServers = [];
	Object.keys(cache.doorData).forEach((provider) => {
		console.log('Provider: ', provider);
		promiseProviders.push(promise_provider(provider));

		// Update doors
		Object.keys(cache.doorData[provider].doors).forEach((door) => {
			console.log('Door: ', door);
			promiseDoors.push(promise_door(provider, door));
			// Update servers
			cache.doorData[provider].doors[door].servers.forEach((server, index) => {
				console.log('Server: ', index);
                promiseDoors.push(promise_server(provider, door, server, index));
			});
		});
	});
    Promise.all(promiseProviders).then((values)=>{
        console.log(values)
        return Promise.all(promiseDoors)
    }).then((values)=>{
        console.log(values)
        return Promise.all(promiseServers)
    }).then((values)=>{
        console.log(values)
        loadDb()
    }).catch((error) => {
        logger.error('Failed to get/create', error);
    });
};

const promise_provider = (provider) => {
	return new Promise((resolve, reject) => {
		calls
			.findOrCreateProvider(provider)
			.then((data) => {
				cache.doorData[provider].dbId = data.id;
				resolve(true);
			})
			.catch((error) => {
				logger.error('Failed to get/create provider ', error);
				reject(false);
			});
	});
};
const promise_door = (provider, door) => {
	return new Promise((resolve, reject) => {
		calls
			.findOrCreateDoor(provider, door)
			.then((data) => {
				console.log(cache.doorData[provider].doors[door]);
				cache.doorData[provider].doors[door].dbId = data.id;
				//cache.doorData[provider].doors[door].servers = [];
				resolve(true);
			})
			.catch((error) => {
				logger.error('Failed to get/create door ', error);
				reject(false);
			});
	});
};
const promise_server = (provider, door, server, index) => {
	return new Promise((resolve, reject) => {
		calls
			.findOrCreateServer(provider, door, server)
			.then((data) => {
				console.log("server: ",cache.doorData[provider].doors[door]);
				cache.doorData[provider].doors[door].servers[index].dbId = data.id;
				resolve(true);
			})
			.catch((error) => {
				logger.error('Failed to get/create server ', error);
				reject(false);
			});
	});
};

const loadDb = () => {
	// Run through all providers
	calls.findAllProviders().then((providers) => {
		providers.forEach((provider) => {
			if (provider in cache.doorData) {
				// provider found
			} else {
				cache.doorData[provider.providerId] = {
					doors: {},
				};
			}
		});
		// Run through all doors
		calls.findAllDoors().then((doors) => {
			doors.forEach((door) => {
				if (door in cache.doorData[door.providerId].doors) {
					// Reset
					cache.doorData[door.providerId].doors[door.doorId].servers = [];
				} else {
					cache.doorData[door.providerId].doors[door.doorId] = {
						status: 'closed',
						provider: door.providerId,
						doorId: door.doorId,
						servers: [],
					};
				}
			});
			// Run through all servers
			calls.findAllServers().then((servers) => {
				servers.forEach(async (server) => {
					confirmServer(server)
						.then(() => {
							cache.doorData[server.providerId].doors[
								server.doorId
							].servers.push({
								serverIp: server.ip,
								port: server.port,
								ssl: server.ssl,
								registerKey: server.registerKey,
							});
						})
						.catch((error) => {
							calls
								.removeServer(server.id)
								.then((success) => {
									console.info('Server removed from database');
								})
								.catch(() => {
									console.info('Failed to remove server from database');
								});
						});
				});
			});
		});
	});
};

const confirmServer = async (server) => {
	let serverUrl = server.ip + ':' + server.port + '/api/status';
	if (server.ssl) {
		serverUrl = 'https://' + serverUrl;
	} else {
		serverUrl = 'http://' + serverUrl;
	}
	return new Promise(async (resolve, reject) => {
		await axios
			.post(serverUrl, { registration_key: server.registerKey })
			.then((success) => {
				if (success.data.status == 'success') {
					resolve();
				} else {
					reject(success);
				}
			})
			.catch((error) => {
				reject(error);
			});
	});
};

/* Refresh db */
setTimeout(() => {
	updateDBTimer();
}, 1000);

/* Create routes */
const routes = require('./routes/routes');
app.use('/', routes);
