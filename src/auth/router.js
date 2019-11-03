'use strict';

require('dotenv').config();
const express = require('express');
const authRouter = express.Router();

const Users = require('./users-model.js');
const auth = require('./middleware.js');
const oauth = require('./oauth/google.js');
const mongoose = require('mongoose');
    mongoose.connect('mongodb://localhost:27017', {
      useCreateIndex: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
});
const app =express();
app.use(express.json());
app.use(express.urlencoded({extended: true}));

authRouter.post('/signup', (req, res, next) => {
  let users = new Users(req.body);
  users.save()

    .then( (users) => {
      req.token = users.generateToken();
      req.users = users;
      res.set('token', req.token);
      res.cookie('auth', req.token);
      res.send(req.token);
    })
    .catch(next);
});

authRouter.post('/signin', auth(), (req, res, next) => {
  res.cookie('auth', req.token);
  res.send(req.token);
});

authRouter.get('/public-stuff', (req, res) => {
  res.send('visible to anyone');
});

// authRouter.get('/hidden-stuff', auth(['valid login']), (req,res) => {
//   res.cookie('auth', req.token);
//   res.send(req.token);
// });

authRouter.get('/hidden-stuff', (req, res, next) => {
  oauth.authorize(req)
      .then(token => {
        res.status(200).send(token);
        console.log('You have a valid token');
      })
      .catch(next);
      });

authRouter.get('/something-to-read', auth('read'), (req, res, next) => {
  oauth.authorize(req)
      .then(token => {
        res.status(200).send(token);
        console.log('read capability only');
      })
      .catch(next);
});

authRouter.get('/everything', auth('create, read, update, delete'), (req,res,next) => {
  res.send('superuser capability');
});

authRouter.get('/oauth', (req,res,next) => {
  oauth.authorize(req)
      .then( token => {
        res.status(200).send(token);
      })
      .catch(next);
});

authRouter.post('/create-a-thing', auth('create'), (req, res) => {
  res.send('create capability');
});

authRouter.put('/update', auth('update'), (req,res,next) => {
  res.send('update capability');
});

authRouter.patch('/jp', auth('update'), (req,res,next) => {
  res.send('update capability');
});

authRouter.delete('/bye-bye', auth('delete'), (req,res,next) => {
  res.send('delete capability');
});


authRouter.post('/key', auth, (req,res,next) => {
  let key = req.users.generateKey();
  res.status(200).send(key);
});

module.exports = authRouter;
