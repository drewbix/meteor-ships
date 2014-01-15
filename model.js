Users = Meteor.users;
Planets = new Meteor.Collection('planets');
Soldiers = new Meteor.Collection('soldiers');
Chat = new Meteor.Collection('chat');

exp2level = [0, 0, 50, 100, 200, 400, 800, 1600, 3000, 6000, 12000, 
           24000, 48000, 100000, 200000, 300000, 
           400000, 500000, 600000, 800000, 1000000];


if (Meteor.isServer) {
  // publish all the non-idle players.
  Meteor.publish('userData', function () {
    return Users.find({idle: false},
        {fields: {'fuel': 1, 'planet': 1, 'soldierCount': 1, 'soldiers': 1}});
  });
  Meteor.publish('planets', function() {
    return Planets.find();
  });
  Meteor.publish('soldiers', function() {
    return Soldiers.find();
  });
  Meteor.publish('chat', function() {
    return Chat.find({}, {limit: 30, sort: {time: -1}});
  });
}