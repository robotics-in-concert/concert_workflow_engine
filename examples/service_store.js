#!/usr/bin/env node

var _ = require('lodash'),
    net = require('net'),
  MongoClient = require('mongodb').MongoClient,
  colors = require('colors'),
  bodyParser = require('body-parser'),
  swig = require('swig'),
  express = require('express'),
  MongoClient = require('mongodb').MongoClient,
  clone = require('clone'),
  ServiceStore = require('../service_store'),
  Engine = require('../engine');
  


var ss = new ServiceStore({ros_root: '/Users/eskim/workspace/tmp/ros_root'});
ss.exportToROS('turtle_concert_second_version', {
  name: "Author service "+ new Date().getTime(),
  parameters: [
    {key: 'key1', value: 'value1'},
    {key: 'key2', value: 'value2'},

  ]
});
