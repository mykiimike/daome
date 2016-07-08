# Direct Access Object for Mongoose with Express.js


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

From server side
```bash
npm install daome
```

From client side
```html
<script src="/yourPath/dao/assets/app.js"></script>
```

## Introduction

Mongoose provides the method to manage the model. DAOME does not include this feature.

That why you have to define your own model using Mongoose before anything.

As DAOME provides the controller and views is it important to point that input validation is made by the model (Mongoose Model). But DAOME accepts access and priviledges control.

Server API is separed in 3 features:

* The controller which will manage requests with express.js
* The view manager (server and client side)
* The express.js initializer



[gt-issues]: https://img.shields.io/github/issues/mykiimike/daome.svg
[gt-licence]: https://img.shields.io/badge/license-GPLv3-blue.svg
