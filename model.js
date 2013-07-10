Users = Meteor.users;
Planets = new Meteor.Collection('planets');
Soldiers = new Meteor.Collection('soldiers');

exp2level = [{1:0, 2:50, 3:100, 4:200, 5:400, 6:800, 7:1600, 8:3000, 9:6000, 10:12000, 
           11:24000, 12:48000, 13:100000, 14:200000, 15:300000, 
           16:400000, 17:500000, 18:600000, 19:800000, 20:1000000}];


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
}