const Homey = require('homey');

module.exports = [
  {
    method: 'GET',
    path: '/users',
    fn: function(args, callback) {
      Homey.app.getUsers().then(res => callback(null, res)).catch(callback);
    }
  },
  {
    method: 'PUT',
    path: '/users',
    fn: function(args, callback) {
      let user = args.body;
      Homey.app
        .trackUser(user)
        .then(res => callback(null, true))
        .catch(callback);
    }
  },
  {
    method: 'DELETE',
    path: '/users',
    fn: function(args, callback) {
      let user = args.body;
      Homey.app
        .untrackUser(user)
        .then(res => callback(null, true))
        .catch(callback);
    }
  }
];
