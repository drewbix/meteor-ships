function getDistance(planet1, planet2) {
  var planet = Planets.findOne({name: planet1});
  var distance = planet.distances[planet2];
  if (!distance) {
    return 0;
  }
  return distance;
}

function toggleSoldierView () {
  Session.set('showSoldiers', false);
}

function toggleConsole() {
  var current = Session.get('showConsole');
  Session.set('showConsole', !current);
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
  };

  Template.player.events({
    'click a#logoutButton': function (evt) {
      Meteor.logout();
      evt.preventDefault();
    }
  });
  //
  // Controls Template
  //
  Template.controls.events({
    'click .soldiertoggle': function(e) {
      TweenLite.set($('.sidebar'), {perspective:400});
      TweenLite.to($('#mysoldiers'), 0.5, {rotationY:90, transformOrigin:'right top', onComplete:toggleSoldierView});
    }
  });
  //
  // Planets Template
  //
  Template.planets.show = function () {
    return true;
  };

  Template.planets.planets = function () {
    return Planets.find();
  };
  Template.planets.events({
    'change #planetSelect': function (evt) {
      var newplanet = $('#planetSelect').val();
      if (newplanet !== '') {
        var player = Users.findOne( {_id: Meteor.userId()} );
        var currentPlanet = Planets.findOne({name: player.planet});
        var distance = getDistance(currentPlanet.name, newplanet);
        if (player.fuel >= distance) {
          Meteor.call('travel', newplanet);
        } else {
          alert('You must wait for your ships fuel to recharge');
        }
      }
    }
  });

  //
  // Ship Template
  //
  Template.ship.planet = function () {
    var planet = '';
    var player = Users.findOne({_id: Meteor.userId()});
    if (player !== null) {
      planet = player.planet;
    }
    return planet;
  };
  Template.ship.fuelLevel = function () {
    var fuel = 0;
    var player = Users.findOne({_id: Meteor.userId()});
    if (player) {
      fuel = player.fuel;
    }
    return fuel;
  };
  Template.ship.fuelPercent = function () {
    var fuel = 0;
    var player = Users.findOne({_id: Meteor.userId()});
    if (player) {
      fuel = player.fuel;
    }
    var fuelPercent = (fuel / 2000) * 100;
    return fuelPercent;
  };
  //
  // Barracks template
  //
  Template.barracks.soldiers = function() {
    var soldiersHere = [];
    var user = Users.findOne({_id: Meteor.userId()});
    if (user !== null && user !== undefined) {
      var currentPlanet = user.planet;
      var planet = Planets.findOne({name: currentPlanet});
      if (planet !== null && planet !== undefined) {
        var freeSoldiers = planet.soldiers;
        for (i = 0; i < freeSoldiers.length; i++) {
          soldiersHere.push(Soldiers.findOne({_id: freeSoldiers[i]}));
        }
      }
    }
    return soldiersHere;
  };
  Template.barracks.events({
    'click .hireButton': function(evt) {
      evt.preventDefault();
      //alert(this._id);
      Meteor.call('hire', this._id);
    }
  });
  //
  // Soldiers template
  //
  Template.mysoldiers.show = function() {
    // return Session.get('showSoldiers');
    return true;
  };
  Template.mysoldiers.soldiers = function() {
    var mySoldiers = [];
    var user = Users.findOne({_id: Meteor.userId()});
    if (user !== null && user !== undefined) {
      var allSoldiers = user.soldiers;
      if (allSoldiers !== null && allSoldiers !== undefined) {
        for (var i = 0; i < allSoldiers.length; i++) {
          mySoldiers.push(Soldiers.findOne({_id: allSoldiers[i]}));
        }
      }
    }
    return mySoldiers;
  };
  Template.mysoldiers.levelup = function() {
    var level = this.level;
    var exp = this.exp;
    var needed = exp2level[level];
    if (exp > needed) {
      return true;
    }
    return false;
  };
  Template.mysoldiers.next = function() {
    var level = this.level;
    var exp = this.exp;
    var needed = exp2level[level];
    var tonext = needed - exp;
    if (tonext < 0) tonext = 0;
    return tonext;
  };
  Template.mysoldiers.events({
    'click .soldier': function(e) {
      e.preventDefault();
      Session.set('soldierView', this._id);
    }
  });
  //
  // Chat template
  //
  Template.chat.show = function() {
    return Session.get('showConsole');
  };
  Template.chat.chats = function() {
    return Chat.find();
  };
  Template.chat.online = function() {
    return Users.find().count();
  };
  Template.chat.events({
    'keyup #chatinput': function(e) {
      if (e.keyCode == 13) {
        var message = $('#chatinput').val();
        Meteor.call('sendchat', message);
        $('#chatinput').val('');
      }
    }
  });
  //
  // Soldierview Template
  //
  Template.soldierview.show = function() {
    var selected = Session.get('soldierView');
    return (selected != undefined);
  };
  Template.soldierview.soldier = function() {
    var soldierid = Session.get('soldierView');
    if (soldierid != undefined) {
      return Soldiers.findOne({_id: soldierid});
    }
  };
  Template.soldierview.tonext = function() {
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    var level = soldier.level;
    var exp = soldier.exp;
    var needed = exp2level[level];
    var tonext = needed - exp;
    if (tonext < 0) tonext = 0;
    return tonext;
  };
  Template.soldierview.hascp = function() {
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    return (soldier.cp > 0);
  }
  Template.soldierview.events({
    'click .levelup': function() {
      var soldierid = Session.get('soldierView');
      var soldier = Soldiers.findOne({_id: soldierid});
      var level = soldier.level;
      var exp = soldier.exp;
      var needed = exp2level[level];
      if (exp >= needed) {
        Meteor.call('levelup', soldier._id);
      } else {
        alert('not enough experience!');
      }
    },
    'click .addaim': function() {
      Meteor.call('addstat', soldier._id, 'aim');
    },
    'click .addagility': function() {
      Meteor.call('addstat', soldier._id, 'agility');
    },
    'click .addhealth': function() {
      Meteor.call('addstat', soldier._id, 'health');
    },
    'click .addwisdom': function() {
      Meteor.call('addstat', soldier._id, 'wisdom');
    }
  })

}

//////
////// Initialization
//////

Meteor.startup(function () {

    $(function() {
      $(document).on('keyup', function(e) { 
        if(e.which == 192) {
          toggleConsole();
        }
      });
    });

    TweenLite.set($('.sidebar'), {perspective:400});
    Session.set('showSoldiers', true);
    Session.set('showConsole', true);

    $('.starfield').starfield({
      starColor:  'rgba(255,255,255,1)',
      bgColor:        'rgba(0,0,0,1)',
      mouseColor: 'rgba(0,0,0,0.2)',
      fps:            15,
      speed:      0.15,
      quantity:   512,
      ratio:      256,
      class:      'starfield'
    });

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