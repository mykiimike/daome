const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require("express");

const jen = new (require("node-jen"))();

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

var controller = function(name, model) {
	this.name = name;
	this.model = model;
	this.internalViews = {};
	this.internalSearch = [];
}

controller.prototype.views = function(views) {
	var schema = this.model.schema.paths;

	for(var a in views) {
		var view = views[a];

		if(schema[a])
			view.model = schema[a].options;
	
		this.internalViews[a] = view;
	}
	
	return(true);
}

controller.prototype.permission = function(sw, field) {
	return(true);
}

controller.prototype.publish = function() {
	var self = this;
	var schema = this.model.schema.paths;
	var app = this.root.app;
	var path = this.root.base+"/api/"+this.name;

	
	app.get(path+'/schema', function(req, res) {
		var errors = [];
		var jres = {
				docs: [],
				errors: errors
		};
		
		if(self.permission(req, "api", "schema") != true) {
			errors.push("Permission denied");
			res.json(jres);
			return;
		}
		
		res.json(self.internalViews);
	});
	
	app.post(path+'/search', function(req, res) {
		var errors = [];
		var jres = {
				docs: [],
				errors: errors
		};
	
		if(self.permission(req, "api", "search") != true) {
			errors.push("Permission denied");
			res.json(jres);
			return;
		}
		
		self.model.find({}, function(err, docs) {
			if(err) {
				errors.push("Can not process search");
				res.json(jres);
				return;
			}
			
			for(var a in docs) {
				var doc = docs[a];
				var ndoc = {};
				
				for(var b in doc) {
					if(typeof self.internalViews[b] == "object") {
						if(self.permission(req, "id", b) == true) {
							if(self.internalViews[b].get)
								ndoc[b] = self.internalViews[b].get(doc[b]);
							else
								ndoc[b] = doc[b];
						}
					}
					else if(b == "_id")
						ndoc[b] = doc[b];
				}
				
				jres.docs.push(ndoc);
			}
			
			res.json(jres);
		});
	});

	app.post(path+'/id', function(req, res) {
		var errors = [];
		var jres = {
				doc: [],
				errors: errors
		};
	
		if(self.permission(req, "api", "id") != true) {
			errors.push("Permission denied");
			res.json(jres);
			return;
		}
		
		self.model.findOne({_id: req.body.id}, function(err, doc) {
			if(err) {
				errors.push("Can load input informations");
				res.json(jres);
				return;
			}

			var ndoc = {};
			
			for(var b in doc) {
				if(typeof self.internalViews[b] == "object") {
					if(self.permission(req, "id", b) == true) {
						if(self.internalViews[b].get)
							ndoc[b] = self.internalViews[b].get(doc[b]);
						else
							ndoc[b] = doc[b];
					}
				}
				else if(b == "_id")
					ndoc[b] = doc[b];
			}
	
			jres.doc = ndoc;
			console.log(ndoc);
			res.json(jres);
		});
	});
	
	app.post(path+'/update', function(req, res) {
		var errors = [];
		var jres = {
				errors: errors
		};
		
		if(self.permission(req, "api", "update") != true) {
			errors.push("Permission denied");
			res.json(jres);
			return;
		}
		
		if(!req.body) {
			res.json({errors: ["No request body!"]});
			return;
		}
		
		if(!req.body.id) {
			res.json({errors: ["No ID!"]});
			return;
		}
		
		self.model.findOne({_id: req.body.id}, function(err, doc) {
			if(err) {
				errors.push("Can load input informations");
				res.json(jres);
				return;
			}
			delete req.body.id;
	
			for(var b in req.body) {
				if(typeof self.internalViews[b] == "object") {
					if(self.permission(req, "update", b) == true)
						doc[b] = req.body[b];
				}
			}
			
			doc.save(function(err) {
				if(!err) {
					res.json(jres);
					return;
				}

				if(err.name == "ValidationError") {
					for(var a in err.errors)
						errors.push(err.errors[a].message);
				}
				else
					errors.push("Some fields are already taken");
				
				res.json(jres);
			});
		});
		
	});

	app.post(path+'/create', function(req, res) {
		var errors = [];
		var jres = {
				errors: errors
		};
		
		if(self.permission(req, "api", "create") != true) {
			errors.push("Permission denied");
			res.json(jres);
			return;
		}

		if(!req.body) {
			res.json({errors: ["No request body!"]});
			return;
		}
	
		var realInput = {};
		for(var a in schema) {
			var sc = schema[a];
		
			if(req.body[a]) {
				if(typeof self.internalViews[a] == "object") {
					if(self.permission(req, "create", a) == true)
						realInput[a] = req.body[a];
				}
			}
		}
		
		var model = new (self.model)(realInput);
		model.save(function(err) {
			if(!err) {
				res.json(jres);
				return;
			}
			console.log(realInput, err);
			if(err.name == "ValidationError") {
				for(var a in err.errors)
					errors.push(err.errors[a].message);
			}
			else
				errors.push("Some fields are already taken");
			
			res.json(jres);
		});
	});
	
	app.post(path+'/remove', function(req, res) {
		var errors = [];
		var jres = {
				errors: errors
		};
		
		if(self.permission(req, "api", "remove") != true) {
			errors.push("Permission denied");
			res.json(jres);
			return;
		}
		
		if(!req.body) {
			res.json({errors: ["No request body!"]});
			return;
		}
		
		if(!req.body.id) {
			res.json({errors: ["No ID!"]});
			return;
		}

		self.model.findOne({_id: req.body.id}).remove(function(err) {
			if(!err) {
				res.json(jres);
				return;
			}

			if(err.name == "ValidationError") {
				for(var a in err.errors)
					errors.push(err.errors[a].message);
			}
			else
				errors.push("Can not remove entry");
			
			res.json(jres);
		});
		
		
	});
	
}




var daome = function(app, base) {
	this.app = app;
	this.base = base;

	this.app.use(base, express.static(__dirname + '/static'));
}

daome.prototype.controller = function(name, model) {
	var hdl = new controller(name, model);
	return(hdl);
}

daome.prototype.publish = function(controller) {
	controller.root = this;
	controller.publish();
}

module.exports = daome;
