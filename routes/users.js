'use strict';

const express = require('express');
const router = express.Router();
const knex = require('../knex');
const boom = require('boom');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const privateKey = 'my_awesome_cookie_signing_key';

const authorize = function(req, res, next) {
  const token = req.cookies.token;
  jwt.verify(token, privateKey, (err, decoded) => {
    if (err) {
      next(boom.create(400, 'Failed to decode token'));
    }
    req.token = decoded;
    next();
  });
};

router.get('/', authorize, function(req, res, next) {
  knex('users')
    .orderBy('username')
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      next(boom.create(500, 'Database Query Failed'));
    });
});

router.get('/:username', authorize, function(req, res, next) {
  knex('users')
    .select('username')
    .where({ username: req.params.username })
    .first()
    .then(function(results) {
      if (results) {
        res.send(results);
      } else {
        next(boom.create(404, 'No user by that name'));
      }
    })
    .catch(function(err) {
      next(boom.create(500, 'Database Query Failed'));
    });
});


router.post('/', (req, res, next) => {
  var hash = bcrypt.hashSync(req.body.password, 8);
  var iconIndex = Math.floor((Math.random() * 10) - 1);
  var iconArray = [

  ]

  knex('users')
    .where({ username: req.body.username })
    .then(function(results) {
      if (results.length === 0) {
        knex('users')
          .insert({
            username: req.body.username,
            password: hash,
            email: req.body.email,
            created_at: new Date(),
            avatar_path: "../public/images/keegan.jpg"
          })
          .then(function(result) {
            res.send(result);
          })
          .catch(function(err) {
            next(boom.create(500, 'Failed to create User'));
          });
      } else {
        next(boom.create(400, 'User Already Exists'));
      }
    });
});

router.patch('/:id', authorize, function(req, res, next) {
  knex('users')
    .max('id')
    .then((result) => {
      if (req.body.password) {
        if (req.params.id <= result[0].max && req.params.id > 0 && !isNaN(req.params.id)) {
          return knex('users')
            .where({ id: req.params.id })
            .first()
            .update({
              username: req.body.username,
              password: bcrypt.hashSync(req.body.password, 8),
              email: req.body.email,
              updated_at: req.body.updated_at
            }, '*')
            .then((result) => {
              //TODO: don't send password back on a successfull patch
              res.send(result[0]);
            })
            .catch((err) => {
              next(boom.create(500, 'Failed to Update User Info'));
            });
        } else {
          next(boom.create(404, 'User Not Found'));
          return;
        }
      } else {
        next(boom.create(404, 'please specify a password'));
        return;
      }
    });
});

router.delete('/:id', authorize, function(req, res, next) {
  knex('users')
    .where({ id: req.params.id })
    .del()
    .then(function() {
      res.sendStatus(200);
    })
    .catch(function(err) {
      next(boom.create(500, 'Failed to delete user'));
    });
});





module.exports = router;
