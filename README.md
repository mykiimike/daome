# Direct Access Object for Mongoose with Express.js

[![Build Status](https://travis-ci.org/mykiimike/daome.svg)](https://travis-ci.org/mykiimike/daome)
[![][gt-issues]][gt-issues]
[![][gt-licence]][gt-licence]

[![NPM](https://nodei.co/npm/daome.png?downloads)](https://nodei.co/npm/daome/)


* Easy dataTable
* Auto API
* Autonomous & standalone system
* Auto modal (but require jquery)
* Server and client 
* Fine permission control possibility
 * By API type (create, update...) 
 * By Fields
* Templates are based on EJS


## Install

```bash
npm install daome
```

## Server side API

Mongoose provides the method to manage the model. DAOME does not include this feature.

That why you have to define your own model using Mongoose before anything.

As DAOME provides the controller and views is it important to point that input validation is made by the model (Mongoose Model). But DAOME accepts access and priviledges control.

```js
const mongoose = require("mongoose");

var mySchema = new Schema({
	name: {type: String },
	value: { type: String },
});
var myModel = mongoose.model('my', mySchema);
```

Server API is separed in 3 features:

* The controller which will manage requests with express.js
* The view
* The express.js initializer

