const Provider = require('./models/providers');
const Door = require('./models/doors');
const Server = require('./models/servers');

const findOrCreateProvider = (provider) => {
	let options = {
		where: { providerId: provider },
	};
	return Provider.findOrCreate(options);
};

const findOrCreateDoor = (provider, door) => {
	let options = {
		where: { providerId: provider, doorId: door },
	};
	return Door.findOrCreate(options);
};

const findOrCreateServer = (provider, door, server) => {
	let options = {
		where: {
			providerId: provider,
			doorId: door,
			ip: server.serverIp,
			port: server.port,
			ssl: server.ssl,
			registerKey: server.registerKey,
		},
	};
	return Server.findOrCreate(options);
};

const findAllProviders = () => {
	return Provider.findAll();
};

const findAllDoors = () => {
	return Door.findAll();
};

const findAllServers = () => {
	return Server.findAll();
};

const removeServer = (id) => {
    return Server.destroy({where: {id: id}})
}

module.exports = {
	findOrCreateDoor,
	findOrCreateProvider,
	findOrCreateServer,
	findAllProviders,
	findAllDoors,
	findAllServers,
    removeServer
};
