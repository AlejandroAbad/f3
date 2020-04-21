'use strict';
//const BASE = global.BASE;
//const C = global.config;
//const L = global.logger;
//const K = global.constants;


const memCache = require('memory-cache');
const fedicomCredentialsCache = new memCache.Cache();
fedicomCredentialsCache.countStats(true);


const checkUser = (authReq) => {
	var cachedPassword = fedicomCredentialsCache.get(authReq.username);
	return (cachedPassword && cachedPassword === authReq.password)
}

const addUser = (authReq) => {
	fedicomCredentialsCache.put(authReq.username, authReq.password);
}

const stats = () => {
	var h = fedicomCredentialsCache.hits();
	var m = fedicomCredentialsCache.misses();
	var total = h + m;
	var ratio = total ? (h * 100) / total : 0;

	return {
		hit: h,
		miss: m,
		entries: fedicomCredentialsCache.size(),
		hitRatio: ratio
	};
}

const clear = () => {
	fedicomCredentialsCache.clear();
}


module.exports = {
	check: checkUser,
	add: addUser,
	stats: stats
}
