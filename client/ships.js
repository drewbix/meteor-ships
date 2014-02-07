function rnd(minv, maxv){
  if (maxv < minv) return 0;
  return Math.floor(Math.random()*(maxv-minv+1)) + minv;
}

function rndColor() {
  var blah = rnd(1,3);
  if (blah == 1) return '#F00';
  if (blah == 2) return '#0F0';
  if (blah == 3) return '#00F';
}

function connect(div1, div2) {
    var off1 = getOffset(div1);
    var off2 = getOffset(div2);
    // get center of div 1
    var x1 = off1.left + off1.width / 2;
    var y1 = off1.top + off1.height / 2;
    // get middle bottom of div 2
    var x2 = off2.left + off2.width / 2;
    var y2 = off2.top + off2.height;
    // distance
    var length = Math.sqrt(((x2-x1) * (x2-x1)) + ((y2-y1) * (y2-y1)));
    // center
    var cx = ((x1 + x2) / 2) - (length / 2);
    var cy = ((y1 + y2) / 2) - (2 / 2);
    // angle
    var angle = Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
    // make hr
    var htmlLine = "<div class='laser' style='left:" + cx + "px; top:" + cy + "px; width:" + length + "px; -moz-transform:rotate(" + angle + "deg); -webkit-transform:rotate(" + angle + "deg); -o-transform:rotate(" + angle + "deg); -ms-transform:rotate(" + angle + "deg); transform:rotate(" + angle + "deg);' />";
    //
    console.log(htmlLine);
    $(div1).append(htmlLine); 
}

function getOffset( el ) {
    return { top: el.offset().top, left: el.offset().left, width: el.width(), height: el.height()};
}

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
  Template.player.loading = function() {
    result = false;
    var test = Users.find().fetch();
    if (test == null || test == undefined) {
      result = true;
    }
    else {
      if (test[0] && !('fuel' in test[0])) result = true;
    }
    
    return result
  }
  Template.player.events({
    'click a#logoutButton': function (evt) {
      Meteor.logout();
      evt.preventDefault();
    }
  });
  //
  // Home Template
  //
  Template.home.show = function () {
    var result = false;
    if (Session.get('leftView') == 'home') result = true;
    return result;
  };
  //
  // Controls Template
  //
  Template.controls.show = function() {
    return true;
  };
  Template.controls.homeactive = function() {
    result = '';
    if (Session.get('leftView') == 'home') result = 'view-active';
    return result;
  };
  Template.controls.hireactive = function() {
    result = '';
    if (Session.get('leftView') == 'hire') result = 'view-active';
    return result;
  };
  Template.controls.storeactive = function() {
    result = '';
    if (Session.get('leftView') == 'store') result = 'view-active';
    return result;
  };
  Template.controls.battleactive = function() {
    result = '';
    if (Session.get('leftView') == 'battle') result = 'view-active';
    return result;
  };
  Template.controls.travelactive = function() {
    result = '';
    if (Session.get('leftView') == 'travel') result = 'view-active';
    return result;
  };
  Template.controls.events({
    'click .soldiertoggle': function(e) {
      TweenLite.set($('.sidebar'), {perspective:400});
      TweenLite.to($('#mysoldiers'), 0.5, {rotationY:90, transformOrigin:'right top', onComplete:toggleSoldierView});
    },
    'click .view-home': function() {
      Session.set('leftView', 'home');
    },
    'click .view-hire': function() {
      Session.set('leftView', 'hire');
    },
    'click .view-store': function() {
      Session.set('leftView', 'store');
    },
    'click .view-battle': function() {
      Session.set('leftView', 'battle');
    },
    'click .view-travel': function() {
      Session.set('leftView', 'travel');
    },
  });
  //
  // Planets Template
  //
  Template.planets.show = function () {
    var result = false;
    if (Session.get('leftView') == 'travel') result = true;
    return result;
  };
  Template.planets.distance = function() {
    var planet = '';
    var player = Users.findOne({_id: Meteor.userId()});
    if (player != null) {
      planet = player.planet
    }
    var result = 'You are here.'
    if (this.distances[planet] != '0') result = this.distances[planet] + ' fuel required';
    return result;
  }
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
  Template.ship.resources = function() {
    var resources = ['rRed', 'rGreen', 'rWhite', 'rBlue', 'rBlack'];
    return resources;
  }
  Template.ship.player = function () {
    var player = Users.findOne({_id: Meteor.userId()});
    return player;
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
  Template.barracks.show = function () {
    var result = false;
    if (Session.get('leftView') == 'hire') result = true;
    return result;
  };
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
  Template.barracks.rating = function() {
    //formulate derived from the line formed by the points 2,24 and 10,77
    //y = mx + b;
    var x = (43/4);
    var y = (53/8);
    var stat1 = this.agility;
    var stat2 = this.concentration;
    var stat3 = this.health;
    var stat4 = this.wisdom + this.cp;
    var avg = (stat1+stat2+stat3+stat4)/4;
    var result = Math.round( ((avg-x)/y)*10 ) / 10;
    return result;
  }
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
  Template.mysoldiers.nosoldiers = function() {
    var user = Users.findOne({_id: Meteor.userId()});
    return (user.soldierCount == 0);
  }
  Template.mysoldiers.levelup = function() {
    var level = this.level;
    var exp = this.exp;
    var needed = exp2level[level];
    if (exp > needed) {
      return true;
    }
    return false;
  };
  Template.mysoldiers.soldierselected = function() {
    var result = false;
    var selected = Session.get('soldierView');
    if (selected != undefined) {
      if (selected == this._id) result = true;
    }
    return result;
  };
  Template.mysoldiers.dead = function() {
    return this.hp <= 0;
  }
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
  Template.chat.rendered = function() {
    if (Session.get('showConsoloe') == false) console.log('rendered!');
  };
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
  Template.soldierview.rating = function() {
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    var x = (43/4);
    var y = (53/8);
    var stat1 = soldier.agility;
    var stat2 = soldier.concentration;
    var stat3 = soldier.health;
    var stat4 = soldier.wisdom;
    var stat5 = (soldier.maxhp + 25)/(25/4);
    var avg = (stat1+stat2+stat3+stat4+stat5)/5;
    var result = Math.round( ((avg-x)/y)*10 ) / 10;
    return result;
  }
  Template.soldierview.hascp = function() {
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    return (soldier.cp > 0);
  }
  Template.soldierview.actions = function() {
    var actions = ['training', 'resting', 'rBlue', 'rBlack', 'rRed', 'rGreen', 'rWhite'];
    return actions;
  };
  Template.soldierview.actionselected = function() {
    var a = this;
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    var result='';
    if (soldier.action == a) result="actionselected";
    return result;

  };
  Template.soldierview.isChecked = function() {
    var a = this;
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    var result = '';
    if (soldier.action == a) result = 'checked';
    return result;
  };
  Template.soldierview.noaction = function() {
    var soldierid = Session.get('soldierView');
    soldier = Soldiers.findOne({_id: soldierid});
    var result = false;
    if (soldier.actionTime == 0) result = true;
    return result;
  };
  Template.soldierview.events({
    'click .close': function() {
      Session.set('soldierView', undefined)
    },
    'change input[name="actionselect"]': function(e) {
      var soldierid = Session.get('soldierView');
      var newaction = $(e.currentTarget).val();
      Meteor.call('changeaction', soldierid, newaction);
    },
    'click .recall-button': function() {
      var soldierid = Session.get('soldierView');
      var soldier = Soldiers.findOne({_id: soldierid});
      Meteor.call('stopaction', soldier._id);
    },
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
    'click .fire': function() {
      Meteor.call('fire', soldier._id);
      Session.set('soldierView', undefined);
    },
    'click .addconcentration': function() {
      Meteor.call('usecp', soldier._id, 'concentration');
    },
    'click .addagility': function() {
      Meteor.call('usecp', soldier._id, 'agility');
    },
    'click .addhealth': function() {
      Meteor.call('usecp', soldier._id, 'health');
    },
    'click .addwisdom': function() {
      Meteor.call('usecp', soldier._id, 'wisdom');
    }
  });
  //
  // Challenge Template
  //
  Template.challenge.show = function () {
    var result = false;
    if (Session.get('leftView') == 'battle') result = true;
    return result;
  };
  Template.challenge.nobattle = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    return player.battle_id == null;
  }
  Template.challenge.noone = function() {
    result = false;
    var users = Users.find({battle_id: null, idle: false, _id: {$ne: Meteor.userId()}}).fetch();
    if (users.length == 0) result = true;
    return result;
  }
  Template.challenge.users_online = function() {
    return Users.find({battle_id: null, idle: false, _id: {$ne: Meteor.userId()}});
  };
  Template.challenge.recent = function() {
    var last = this.last_keepalive;
    var now = (new Date()).getTime();
    var diff = (now - last);
    return diff;
  };
  Template.challenge.events({
    'click .challenge-user': function(e) {
      Meteor.call('start_new_battle', Meteor.userId(), this._id);
      Session.set('soldierView', undefined);
    }
  });
  //
  // Battle Template
  //
  Template.battle.rendered = function() {
    var max = 3;
    var checkboxes = $('input[name="soldierselect"]');
    var current = checkboxes.filter(':checked').length;
    checkboxes.filter(':not(:checked)').prop('disabled', current >= max);
  }
  Template.battle.show = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return player.battle_id !== null && player.battle_id != undefined;
  };
  Template.battle.player1 = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    if (!battle) return false;
    var challenger = Users.findOne({_id: battle.player1});;
    if (!challenger) return false;
    return challenger.username;
  };
  Template.battle.teams = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    if (!battle) return false;
    var team1 = battle.team1;
    var team2 = battle.team2;
    return team1.concat(team2);
  };
  Template.battle.soldiers = function() {
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
  Template.battle.notready = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    if (battle.player1 == player._id) {
      return !battle.player1ready;
    } else {
      return !battle.player2ready;
    }
  };
  Template.battle.player2notready = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return !battle.player2ready;
  }
  Template.battle.challenger = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return battle.player1 == player._id;
  };
  Template.battle.battlestarted = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id}); 
    return (battle.status == 'battlestarted' || battle.status == 'battlefinished')
  };
  Template.battle.battleaccepted = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return (battle.status == 'battleaccepted')
  };
  Template.battle.battledeclined = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return (battle.status == 'battledeclined');
  };
  Template.battle.events({
    'click .accept-button': function() {
      var player = Users.findOne({_id: Meteor.userId()});
      Meteor.call('battleAccept', player.battle_id);
    },
    'click .decline-button': function() {
      var player = Users.findOne({_id: Meteor.userId()});
      Meteor.call('battleDecline', player.battle_id);
    },
    'click .decline-confirm': function() {
      Meteor.call('battleDeclineConfirm');
    },
    'change input[name="soldierselect"]': function() {
      var max = 3;
      var checkboxes = $('input[name="soldierselect"]');
      var current = checkboxes.filter(':checked').length;
      checkboxes.filter(':not(:checked)').prop('disabled', current >= max);
    },
    'click .ready-button': function() {
      var checked = $('input[name="soldierselect"]:checked');
      if (checked.length == 3) {
        var soldiers = checked[0].value+','+checked[1].value+','+checked[2].value;
        Meteor.call('setSoldiers', soldiers);
      } else {
        alert('Please select 3 soldiers');
      }
    },
    'click .fight-button': function() {
      var player = Users.findOne({_id: Meteor.userId()});
      Meteor.call('battleStart', player.battle_id);
    }
  })
  //
  // Arena Template
  //
  Template.arena.healthpercent = function() {
    if (this.hp > 0) {
      return (this.hp / this.maxhp) * 100;
    } else {
      return 0;
    }
  };
  Template.arena.dead = function() {
    return this.hp <= 0;
  }
  Template.arena.gameover = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id}); 
    return battle.status == 'battlefinished';
  };
  Template.arena.winner = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id}); 
    return battle.winner == player._id;
  };
  Template.arena.player1 = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return Users.findOne({_id: battle.player1});
  };
  Template.arena.team1 = function() {
    var soldiers = [];
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    var allSoldiers = battle.team1;
    for (var i = 0; i < allSoldiers.length; i++) {
      soldiers.push(Soldiers.findOne({_id: allSoldiers[i]}));
    }
    return soldiers;
  };
  Template.arena.player2 = function() {
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    return Users.findOne({_id: battle.player2});
  };
  Template.arena.team2 = function() {
    var soldiers = [];
    var player = Users.findOne({_id: Meteor.userId()});
    var battle = Battles.findOne({_id: player.battle_id});
    var allSoldiers = battle.team2;
    for (var i = 0; i < allSoldiers.length; i++) {
      soldiers.push(Soldiers.findOne({_id: allSoldiers[i]}));
    }
    return soldiers;
  };
  Template.arena.events({
    'click .close-button': function() {
      Meteor.call('battleClose');
    }
  });

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
  if (Session.get('leftView') == undefined) {
    Session.set('leftView', 'home');
  }
  
  // Session.set('showConsole', true);

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
    Meteor.subscribe('battles');
    Meteor.subscribe('battlelog');

  });

    var p = Users.find({_id: Meteor.userId(), battle_id: {$ne: null}});
    var battlehandler;
    var handle = p.observe({
      added: function(newdoc) {
        console.log('player added: ' + newdoc.battle_id);
        if (newdoc.battle_id != null && newdoc.battle_id != undefined) {
          b = BattleLog.find({battle_id: newdoc.battle_id});
          if (Session.get('battle') == undefined) {
            Session.set('battle', newdoc.battle_id)
            console.log('battlestarted?');
            battlehandler = b.observeChanges({
              added: function(id, msg) {
                // console.log('battle add ' + id + ': ' + msg.soldier + ',' + msg.target + ', dmg: ' + msg.damage);
                var soldierdiv = $('.' + msg.soldier);
                var targetdiv = $('.' + msg.target);
                connect(soldierdiv, targetdiv, rndColor(), 5);
                if (msg.damage > 0) {
                  var p = $('<div/>').addClass('dmg').css('left', rnd(0,100) + 'px').html(msg.damage);
                  $('.' + msg.target).append(p);
                } else if (msg.damage == 0) {
                  var p = $('<div/>').addClass('miss').css('left', rnd(0,100) + 'px').html('miss');
                  $('.' + msg.target).append(p);
                }
              },
              changed: function(id, msg) {
                // console.log('battlechange ' + id + ': ' + msg.soldier + ',' + msg.target + ', dmg: ' + msg.damage);
                var soldierdiv = $('.' + msg.soldier);
                var targetdiv = $('.' + msg.target);
                connect(soldierdiv, targetdiv, rndColor(), 5);
                if (msg.damage > 0) {
                  var p = $('<div/>').addClass('dmg').css('left', rnd(0,100) + 'px').html(msg.damage);
                  $('.' + msg.target).append(p);
                } else if (msg.damage == 0) {
                  var p = $('<div/>').addClass('miss').css('left', rnd(0,100) + 'px').html('miss');
                  $('.' + msg.target).append(p);
                }
              }
            });
          }
        }
      },
      changed: function(newdoc, old) {
        console.log('player changed: ' + newdoc.battle_id + ': ' + old.battle_id);
        if (newdoc.battle_id != null && newdoc.battle_id != undefined) {
          b = BattleLog.find({battle_id: newdoc.battle_id});
          if (Session.get('battle') == undefined) {
            Session.set('battle', newdoc.battle_id)
            console.log('battlestarted?');
            battlehandler = b.observeChanges({
              added: function(id, msg) {
                // console.log('battle add ' + id + ': ' + msg.soldier + ',' + msg.target + ', dmg: ' + msg.damage);
                var soldierdiv = $('.' + msg.soldier);
                var targetdiv = $('.' + msg.target);
                connect(soldierdiv, targetdiv, rndColor(), 5);
                if (msg.damage > 0) {
                  var p = $('<div/>').addClass('dmg').css('left', rnd(0,100) + 'px').html(msg.damage);
                  $('.' + msg.target).append(p);
                } else if (msg.damage == 0) {
                  var p = $('<div/>').addClass('miss').css('left', rnd(0,100) + 'px').html('miss');
                  $('.' + msg.target).append(p);
                }
              },
              changed: function(id, msg) {
                // console.log('battlechange ' + id + ': ' + msg.soldier + ',' + msg.target + ', dmg: ' + msg.damage);
                var soldierdiv = $('.' + msg.soldier);
                var targetdiv = $('.' + msg.target);
                connect(soldierdiv, targetdiv, rndColor(), 5);
                if (msg.damage > 0) {
                  var p = $('<div/>').addClass('dmg').css('left', rnd(0,100) + 'px').html(msg.damage);
                  $('.' + msg.target).append(p);
                } else if (msg.damage == 0) {
                  var p = $('<div/>').addClass('miss').css('left', rnd(0,100) + 'px').html('miss');
                  $('.' + msg.target).append(p);
                }
              }
            });
          }
        }
      },
      removed: function(old) {
        console.log('unsetting ' + old.battle_id);
        if (battlehandler) {
          battlehandler.stop();
          console.log('battlehandler stopped');
        }
        Session.set('battle', undefined);
      }
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