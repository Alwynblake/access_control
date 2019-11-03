'use strict';

const Users = require('./users-model.js');

module.exports = (capability) => ( req, res, next) => {
  
  // return (req, res, next) => {

    try {
      let [authType, authString] = req.headers.authorization.split(/\s+/);

      switch (authType.toLowerCase()) {
        case 'basic':
          return _authBasic(authString);
        case 'bearer':
          return _authBearer(authString);
        default:
          return _authError();
      }
    } catch (e) {
      _authError();
    }


    function _authBasic(str) {
    // str: am9objpqb2hubnk=
      let base64Buffer = Buffer.from(str, 'base64'); // <Buffer 01 02 ...>
      let bufferString = base64Buffer.toString();    // john:mysecret
      let [username, password] = bufferString.split(':'); // john='john'; mysecret='mysecret']
      let auth = {username, password}; // { username:'john', password:'mysecret' }

      return Users.authenticateBasic(auth)
        .then(users => _authenticate(users))
        .catch(_authError);
    }

    function _authBearer(authString) {
      return Users.authenticateToken(authString)
        .then(users => _authenticate(users))
        .catch(_authError);
    }

    function _authenticate(users) {
      if ( users && (!capability || (users.can(capability))) ) {
        req.users = users;
        req.token = users.generateToken();
        next();
      } else {
        _authError();
      }
    }

    function _authError() {
      next('Invalid User ID/Password')
    }
  };