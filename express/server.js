'use strict';
const express = require('express');
const path = require('path');
const serverless = require('serverless-http');
const Parser = require('rss-parser');
const axios = require('axios');
const app = express();
const parser = new Parser();
const bodyParser = require('body-parser');

const router = express.Router();
router.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.write('<h1>Hello from Express.js!</h1>');
  res.end();
});
router.get('/tech-feed', async (req, res) => {
  const feeds = await parser.parseURL('https://medium.com/feed/@karansinghvirdi').catch(e => {
    res.status(400).send({message: e.message || 'Something went wrong!'})
  });
  res.status(200).send({data: {feeds}});
});

router.get('/travel', async (req, res) => {
  const {limit = 10, offset = 0} = req.query;
  const files = await axios({
    method: 'get',
    url: 'https://api.imagekit.io/v1/files',
    params: {
      limit,
      skip: offset
    },
    headers: {
      'Authorization': `Basic ${Buffer.from(process.env.IMAGE_KIT_KEY).toString('base64')}`
    }
  }).catch(e => {
    return res.status(400).send({message: 'Something went wrong'});
  });
  const {data} = files;
  const result = data.map(({name}) => (`https://ik.imagekit.io/batman/${name}`));
  return res.status(200).send({data: result});
});

app.use(bodyParser.json());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "https://karansinghvirdi.com");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use('/.netlify/functions/server', router);  // path must route to lambda
app.use('/', (req, res) => res.sendFile(path.join(__dirname, '../index.html')));

module.exports = app;
module.exports.handler = serverless(app);
