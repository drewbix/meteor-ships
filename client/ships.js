function getDistance(planet1, planet2) {
  planet = Planets.findOne({name: planet1});
  distance = planet.distances[planet2]
  if (!distance) {
    return 0;
  }
  return distance;
}

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_ONLY'
});

if (Meteor.isClient) {
  //
  // Player Template
  //
  Template.player.username = function () {
    return Meteor.user().username;
  }

  Template.player.events({
    'click a#logoutButton': function (evt) {
      Meteor.logout();
      evt.preventDefault();
    }
  });

  //
  // Planets Template
  //
  Template.planets.show = function () {
    return true;
  }  

  Template.planets.planets = function () {
    return Planets.find();
  }
  Template.planets.distance = function () {
    player = Users.findOne( {_id: Meteor.userId()} );
    currentPlanet = Planets.findOne({name: player.planet});
    distance = 0;
    return distance;
  }
  Template.planets.events({
    'change #planetSelect': function (evt) {
      var newplanet = $('#planetSelect').val()
      if (newplanet != '') {
        player = Users.findOne( {_id: Meteor.userId()} );
        currentPlanet = Planets.findOne({name: player.planet});
        distance = getDistance(currentPlanet.name, newplanet);
        if (player.fuel >= distance) {
          Meteor.call('travel', Meteor.userId(), newplanet);
        } else {
          alert("You must wait for your ships fuel to recharge");
        }
      }
    }
  });

  //
  // Ship Template
  //
  Template.ship.planet = function () {
    planet = '';
    var player = Users.findOne({_id: Meteor.userId()});
    if (player != null) {
      planet = player.planet
    }
    return planet;
  }
  Template.ship.fuelLevel = function () {
    fuel = 0;
    player = Users.findOne({_id: Meteor.userId()});
    if (player) {
      fuel = player.fuel;
    }
    return fuel;
  }
  Template.ship.fuelPercent = function () {
    fuel = 0;
    player = Users.findOne({_id: Meteor.userId()});
    if (player) {
      fuel = player.fuel;
    }
    fuelPercent = (fuel / 2000) * 100;
    return fuelPercent;
  }
  //
  // Barracks template
  //
  Template.barracks.soldiers = function() {
    soldiersHere = [];
    user = Users.findOne({_id: Meteor.userId()});
    if (user != null && user != undefined) {
      currentPlanet = user.planet;
      planet = Planets.findOne({name: currentPlanet});
      if (planet != null && planet != undefined) {
        freeSoldiers = planet.soldiers;
        for (i = 0; i < freeSoldiers.length; i++) {
          soldiersHere.push(Soldiers.findOne({_id: freeSoldiers[i]}));
        }         
      }     
    }
    return soldiersHere;
  }
  Template.barracks.events({
    'click .hireButton': function(evt) {
      evt.preventDefault();
      //alert(this._id);
      Meteor.call('hire', Meteor.userId(), this._id);
    }
  });
  //
  // Soldiers template
  //
  Template.mysoldiers.show = function() {
    return true;
  }
  Template.mysoldiers.soldiers = function() {
    mySoldiers = [];
    user = Users.findOne({_id: Meteor.userId()});
    if (user != null && user != undefined) {
      allSoldiers = user.soldiers;
      if (allSoldiers != null && allSoldiers != undefined) {
        for (i = 0; i < allSoldiers.length; i++) {
          mySoldiers.push(Soldiers.findOne({_id: allSoldiers[i]}));
        }
      }
    }
    return mySoldiers;
  }
  Template.mysoldiers.levelup = function() {
    level = this.level;
    exp = this.exp;
    needed = exp2level[level];
    if (exp > needed) {
      return true;
    }
    return false;
  }
  Template.mysoldiers.next = function() {
    level = this.level;
    exp = this.exp;
    needed = exp2level[level];
    tonext = needed - exp;
    if (tonext < 0) tonext = 0;
    return tonext;
  }
  Template.mysoldiers.events({
    'click .soldier': function(e) {
      e.preventDefault();
      level = this.level;
      exp = this.exp;
      needed = exp2level[level];
      if (exp > needed) {
        Meteor.call('levelup', this._id);
      } else {
        alert("not enough experience!");
      }
    }
  });
  //
  // Chat template
  //
  Template.chat.chats = function() {
    return Chat.find();
  }
  Template.chat.online = function() {
    return Users.find().count();
  }
  //Template.chat.preserve(["#chatinput"]);
  Template.chat.events({
    'keyup #chatinput': function(e) {
      if (e.keyCode == 13) {
        message = $('#chatinput').val();
        Meteor.call('sendchat', message);
        $('#chatinput').val('');
      }
    }
  });

}

//////
////// Initialization
//////

Meteor.startup(function () {

    $('.starfield').starfield({
      starColor:  "rgba(255,255,255,1)",
      bgColor:        "rgba(0,0,0,1)",
      mouseColor: "rgba(0,0,0,0.2)",
      fps:            15,
      speed:      0.15,
      quantity:   512,
      ratio:      256,
      class:      "starfield"
    });

    setTimeout(function() {$('.chats').scrollTop(1000)}, 1000);

  // subscribe to all the players, the game i'm in, and all
  // the words in that game.
  Deps.autorun(function () {
    Meteor.subscribe('userData');
    Meteor.subscribe('planets');
    Meteor.subscribe('soldiers');
    Meteor.subscribe('chat');

  });

  // send keepalives so the server can tell when we go away.
  //
  // XXX this is not a great idiom. meteor server does not yet have a
  // way to expose connection status to user code. Once it does, this
  // code can go away.
  Meteor.setInterval(function() {
    if (Meteor.status().connected)
      Meteor.call('keepalive', Meteor.userId());
  }, 20*1000);
});