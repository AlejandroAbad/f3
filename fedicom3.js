require('./util/nativeExtensions');
global.config = require('./config');


// Carga de modelos
// require('./api/models/pedidosModel');

var app = require('express')();
app.use(require('body-parser').json({extended: true}));
app.use(require('morgan')('dev'));
app.use(require('express-bearer-token')());

var port = process.env.PORT || 50000;
app.listen(port);

// Carga de rutas
var routes = require('./routes');
routes(app);


console.log('Concentrador Fedicom 3 - v0.0.1');
console.log('Escuchando en el puerto ' + port)
