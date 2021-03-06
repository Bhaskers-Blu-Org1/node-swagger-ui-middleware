/**
 * Licensed Materials - Property of IBM
 * (c) Copyright IBM Corporation 2015, 2016. All Rights Reserved.
 *
 * Note to U.S. Government Users Restricted Rights:
 * Use, duplication or disclosure restricted by GSA ADP Schedule
 * Contract with IBM Corp.
 */
"use strict";

var 
 express = require("express"),
 path = require("path"),
 dust = require("dustjs-linkedin"),
 Readable = require("stream").Readable,
 fs = require("fs")
;

/* Load dust templates from disk after searching the cache and coming back
   empty-handed. This is used by dust.stream() below. */
dust.onLoad = function (filename, callback) {
	fs.readFile(filename, { encoding: "utf8" }, callback);
};

module.exports = function (spec) {
	var r = express.Router();

	r
	.use(express.static(path.join(__dirname, "assets")))
	.get("/", swaggerLandingPageRendererFactory(spec))
	;

	return r;
};

function swaggerLandingPageRendererFactory(spec) {
	return function (req, res) {
		return readSchemaFile(spec, function (err, spec) {
			if (err) {
				console.log("Could not parse swagger spec: " + err.toString());
				return res.status(500).end();
			}

			var templateFilename = path.join(__dirname, "assets", "templates", "swagger.dust");
			var context = {
				spec: spec,
				contextRoot: req.originalUrl
			};


			dust.render(templateFilename, context, function(err, result) {
				if (err) {
					console.log("Dust error: " + e);
			 		return res.status(500).end();	
				}

				return res.send(result);
			});
		});
	};
}

function addPause(oldStream) {
	oldStream.pause = function () {};
	return oldStream;
}

function readSchemaFile(spec, callback) {
	if (typeof spec !== "string") {
		return callback(null, spec);
	}

	// The provided file is a filename.
	fs.readFile(spec, function (err, r) {
		if (err) {
			return callback(err);
		}

		var parsedSpec;

		try {
			parsedSpec = JSON.parse(r);
		} catch (e) { 
			return callback(e);
		}

		return callback(null, parsedSpec);
	});
}