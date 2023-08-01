const app = require("../core");

module.exports = app()
	.get('/:id?', (req, res) => {
		res.end(`Sub: Howdy from ${req.method} ${req.url}`);
	})
	.put('/:id', (req, res) => {
		res.statusCode = 201; // why not?
		res.end(`Sub: Updated user via ${req.method} ${req.url}`);
	});