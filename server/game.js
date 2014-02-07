////////// Server only logic //////////
Accounts.onCreateUser(function(options, user) {
  user.fuel = 1000;
  user.planet = "Jute";
  user.idle = false;
  user.soldierCount = 0;
  //resources
  user.gold = 100;
  user.rBlue = 0;
  user.rBlack = 0;
  user.rRed = 0;
  user.rGreen = 0;
  user.rWhite = 0;
  user.battle_id = null;
  
  // We still want the default hook's 'profile' behavior.
  if (options.profile)
    user.profile = options.profile;
  return user;
});

function rnd(minv, maxv){
  if (maxv < minv) return 0;
  return Math.floor(Math.random()*(maxv-minv+1)) + minv;
}

function generateName() {
  return generate_name('default');
}

function generateNameOld() {
  name = "";
  vowels = ["a","e","i","o","u"];
  cons = ["b", "c", "d","g","h","j","k","l","m","n","p","r","s","t","v","w"];
  syllables = rnd(1,3);
  for (i=0; i<syllables; i++) {
    if (syllables == 1) {
      if (rnd(1,2) == 1) {
        name += vowels[rnd(0,4)] + cons[rnd(0,15)] + vowels[rnd(0,4)];
      } else {
        name += vowels[rnd(0,4)] + cons[rnd(0,15)] + vowels[rnd(0,4)] + cons[rnd(0,15)];
      }
    } else if (syllables != 1 && i == 0) {
      if (rnd(1,2) == 1) {
        name += vowels[rnd(0,4)] + cons[rnd(0,15)];
      } else {
        name += cons[rnd(0,15)] + vowels[rnd(0,4)] + cons[rnd(0,15)];
      }
    } else {
      name += vowels[rnd(0,4)] + cons[rnd(0,15)];
    }
  }
  name = name.charAt(0).toUpperCase() + name.substring(1, name.length);
  return name;
}

function createSoldier() {
  newSoldier = {name: generateName(),
                level: 1,
                exp: rnd(0,500),
                cp: rnd(3,9),
                maxhp: rnd(100,150),
                hp: 0,
                shield: 0,
                concentration: rnd(18,35),
                agility: rnd(18,35),
                health: rnd(18,35),
                wisdom: rnd(18,35),
                action: "training",
                actionTime: 0,
                owned: false,
                battle_id: null,
                image: rnd(1,60)}
  return newSoldier;
}

function randomGun() {
  var rounds = rnd(1,1);
  var min = Math.floor(8/rounds);
  var max = Math.floor(30/rounds);
  var gun = {rate_of_fire: 1,
              rounds: rounds,
              roundsFired: 0,
              reload_time: rnd(30,60),
              reloading: 0,
              minDmg: min,
              maxDmg: max,
              accuracy: rnd(50,75),
              targ: null};
  return gun;
}

function populate() {
  Planets.find({soldierCount: {$lt: 6}}).forEach(function(p) {
    id = p._id;
    newSoldier = Soldiers.insert(createSoldier());
    Planets.update({_id: id},
                   {$push: {soldiers: newSoldier}, $inc: {soldierCount: 1}});    
  });
}

function soldierTraining() {
  Soldiers.find({action: "training", owned: true}).forEach(function(soldier) {
    var addexp = soldier.wisdom*3;
    Soldiers.update({_id: soldier._id},
                    {$inc: {exp: addexp}});
  });
}

function checkHealthBonus(soldier_id) {
  var soldier = Soldiers.findOne({_id: soldier_id});
  if (soldier.health %5 == 0) {
    var x = (soldier.health / 5);
    var addhp = rnd(x,(x*2));
    Soldiers.update({_id: soldier_id},
                    {$inc: {maxhp: addhp}});
    
    timestamp = (new Date()).getTime();
    msg = soldier.name + ' got bonus hp: ' + addhp;
    Chat.insert({name: 'Game', message: msg, time: timestamp});  
  }
}

function addStat(soldier_id, stat) {
  switch(stat) {
    case "concentration":
      Soldiers.update({_id: soldier_id},
                      {$inc: {concentration: 1}});
      break;
    case "agility":
      Soldiers.update({_id: soldier_id},
                      {$inc: {agility: 1}});
      break;
    case "health":
      Soldiers.update({_id: soldier_id},
                      {$inc: {health: 1}});
      checkHealthBonus(soldier_id);
      break;
    case "wisdom":
      Soldiers.update({_id: soldier_id},
                      {$inc: {wisdom: 1}});
      break;
  }
}

function addResource(player_id, resource, amount) {
  switch(resource) {
    case "rRed":
      Users.update({_id: player_id},
                   {$inc: {rRed: amount}});
      break;
    case "rGreen":
      Users.update({_id: player_id},
                   {$inc: {rGreen: amount}});
      break;
    case "rBlue":
      Users.update({_id: player_id},
                   {$inc: {rBlue: amount}});
      break;
    case "rWhite":
      Users.update({_id: player_id},
                   {$inc: {rWhite: amount}});
      break;
    case "rBlack":
      Users.update({_id: player_id},
                   {$inc: {rBlack: amount}});
      break;
  }
}

function getDistance(planet1, planet2) {
  planet = Planets.findOne({name: planet1});
  distance = planet.distances[planet2]
  if (!distance) {
    return 0;
  }
  return distance;
}

Meteor.methods({
  start_new_battle: function(player1, player2) {
    check(player1, String);
    check(player2, String);
    var battle_id = Battles.insert({player1ready: false, player2ready: false, status: 'challengesent'});
    Users.update({_id: player1},
                 {$set: {battle_id: battle_id}});
    Users.update({_id: player2},
                 {$set: {battle_id: battle_id}});
    var p = Users.find({battle_id: battle_id}).fetch();
    var p1 = Users.findOne({_id: player1});
    var p2 = Users.findOne({_id: player2});
    var team1 = p1.soldiers || [];
    var team2 = p2.soldiers || [];
    Soldiers.update({_id: {$in: team1}},
                    {$set: {battle_id: battle_id, team: 1}});
    Soldiers.update({_id: {$in: team2}},
                    {$set: {battle_id: battle_id, team: 2}});
    Battles.update({_id: battle_id}, {$set: {player1: player1, player2: player2, team1: undefined, team2: undefined}});

  },
  battle: function(battle_id) {
    check(battle_id, String);
    var battle = Battles.findOne({_id: battle_id});
    var team1 = battle.team1;
    var team2 = battle.team2;
    var teams = team1.concat(team2);
    var allsoldiers = Soldiers.find({battle_id: battle_id}).fetch();
    var timestamp,msg,dmg,targ,updatetarg,winner;

    Battles.update({_id: battle_id},
                   {$set: {status: 'battlestarted'}});

    for (var i = 0; i < allsoldiers.length; i++) {
      allsoldiers[i].gunstats = randomGun();
    }

    var game = Meteor.setInterval(function() {
      for (var i = 0; i < allsoldiers.length; i++) {
        if (allsoldiers[i].gunstats.reloading > 0 && allsoldiers[i].gunstats.reloading <= allsoldiers[i].gunstats.reload_time) {
          //reloading
          allsoldiers[i].gunstats.reloading += 1;
        } 
        else if (allsoldiers[i].gunstats.reloading > allsoldiers[i].gunstats.reload_time) {
          //done reloading
          allsoldiers[i].gunstats.reloading = 0;
          allsoldiers[i].gunstats.targ = null;
        }
        else {
          //firing
          if (allsoldiers[i].gunstats.roundsFired < allsoldiers[i].gunstats.rounds) {
            timestamp = (new Date()).getTime();
            dmg = rnd(allsoldiers[i].gunstats.minDmg, allsoldiers[i].gunstats.maxDmg);
            //chance to miss
            if ( (rnd(1,100)) > allsoldiers[i].gunstats.accuracy ) dmg = 0;
            //set a target
            if (allsoldiers[i].gunstats.targ == null) {
              if (allsoldiers[i].team == 1) {
                allsoldiers[i].gunstats.targ = team2[rnd(0, (team2.length - 1))];
              }
              else {
                allsoldiers[i].gunstats.targ = team1[rnd(0, (team1.length - 1))];
              }
            }
            targ = Soldiers.findOne({_id: allsoldiers[i].gunstats.targ});
            msg = allsoldiers[i].name + ' did ' + dmg + ' damage to ' + targ.name + '!';
            if (dmg == 0) msg = allsoldiers[i].name + ' shot at ' + targ.name + ' but missed.';
            BattleLog.insert({battle_id: battle_id, soldier: allsoldiers[i]._id, target: allsoldiers[i].gunstats.targ, damage: dmg});
            Soldiers.update({_id: allsoldiers[i].gunstats.targ},
                            {$inc: {hp: dmg*-1}});
            Chat.insert({name: 'Game', message: msg, time: timestamp});
            if (allsoldiers[i].team == 1) {
                Battles.update({_id: battle_id},
                               {$push: {team1log: msg}});
              }
              else {
                Battles.update({_id: battle_id},
                               {$push: {team2log: msg}});
              }
            allsoldiers[i].gunstats.roundsFired += 1;

            //check if the game should end
            updatetarg = Soldiers.findOne({_id: allsoldiers[i].gunstats.targ});
            if (updatetarg.hp <= 0) {
              //someone died, figure out who won
              if (allsoldiers[i].team == 1) {
                winner = battle.player1;
              }
              else {
                winner = battle.player2;
              }
              //game ending actions
              Meteor.clearInterval(game);
              i = allsoldiers.length;
              timestamp = (new Date()).getTime();
              msg = updatetarg.name + ' is dead !!!!!';
              Chat.insert({name: 'Game', message: msg, time: timestamp});
              Battles.update({_id: battle_id},
                             {$set: {status: 'battlefinished', winner: winner}, $push: {team1log: msg, team2log: msg}});
              Soldiers.update({battle_id: battle_id},
                              {$set: {battle_id: null}});
            }
          }
          else {
            //done firing
            allsoldiers[i].gunstats.reloading = 1;
            allsoldiers[i].gunstats.roundsFired = 0;
          }        
        }


      }
    }, 100)

  },
  battleAccept: function(battle_id) {
    check(battle_id, String);
    var battle = Battles.findOne({_id: battle_id});
    Battles.update({_id: battle_id},
                   {$set: {status: 'battleaccepted'}});
  },
  battleDecline: function(battle_id) {
    check(battle_id, String);
    var battle = Battles.findOne({_id: battle_id});
    Battles.update({_id: battle_id},
                   {$set: {status: 'battledeclined'}});
    Users.update({_id: this.userId},
                 {$set: {battle_id: null}});
  },
  battleDeclineConfirm: function() {
    Users.update({_id: this.userId},
                 {$set: {battle_id: null}});
  },
  setSoldiers: function(soldier_ids) {
    check(soldier_ids, String);
    var soldiers = soldier_ids.split(',');
    var player = Users.findOne({_id: this.userId});
    var battle = Battles.findOne({_id: player.battle_id});
    var i,timestamp = (new Date()).getTime();

    if (battle.player1 == this.userId) {
      for (i = 0; i < soldiers.length; i++) {
        Soldiers.update({_id: soldiers[i]},
                        {$set: {battle_id: player.battle_id, team: 1}});
      }
      Battles.update({_id: player.battle_id},
                     {$set: {player1ready: true, team1: soldiers}});
    }

    if (battle.player2 == this.userId) {
      for (i = 0; i < soldiers.length; i++) {
        Soldiers.update({_id: soldiers[i]},
                        {$set: {battle_id: player.battle_id, team: 2}});
      }
      Battles.update({_id: player.battle_id},
                     {$set: {player2ready: true, team2: soldiers}});
    }
  },
  battleStart: function(battle_id) {
    check(battle_id, String);
    //check if both players are ready
    var battle = Battles.find({_id: battle_id}).fetch();
    if (battle[0].player1ready && battle[0].player2ready) {
      Meteor.call('battle', battle_id)
    }
  },
  battleClose: function() {
    Users.update({_id: this.userId},
                 {$set: {battle_id: null}});
  },
  keepalive: function (player_id) {
    check(player_id, String);
    Users.update({_id: player_id},
                 {$set: {last_keepalive: (new Date()).getTime(),
                         idle: false}});
  },
  travel: function(newPlanet) {
    check(newPlanet, String);
    player = Users.findOne( {_id: this.userId} );
    currentPlanet = player.planet;
    distance = getDistance(currentPlanet, newPlanet);
    if (player.fuel >= distance) {
      Users.update({_id: this.userId},
                   {$set: {planet: newPlanet}, $inc: {fuel: -(distance)}});
    }  
  },
  hire: function(soldier_id) {
    check(soldier_id, String);
    soldier = Soldiers.findOne({_id: soldier_id});
    player = Users.findOne({_id: this.userId});
    planet = Planets.findOne({name: player.planet});
    if (!soldier || soldier.owned == true) {
      return
    }
    if (player.soldierCount < 5) {
      Soldiers.update({_id: soldier_id},
                     {$set: {owned: true}});
      Users.update({_id: this.userId},
                     {$push: {soldiers: soldier_id}, $inc: {soldierCount: 1}});
      Planets.update({_id: planet._id}, 
                     {$pull: {soldiers: soldier_id}, $inc: {soldierCount: -1}});
    }

  },
  fire: function(soldier_id) {
    check(soldier_id, String);
    soldier = Soldiers.findOne({_id: soldier_id});
    player = Users.findOne({_id: this.userId});
    if (!soldier) return
    Soldiers.update({_id: soldier_id},
                   {$set: {owned: false}});
    Users.update({_id: this.userId},
                   {$pull: {soldiers: soldier_id}, $inc: {soldierCount: -1}});

  },
  changeaction: function(soldier_id, newaction) {
    check(soldier_id, String);
    check(newaction, String);
    //probably should add validation to make sure the calling client owns the soldier
    var timestamp = (new Date()).getTime();
    Soldiers.update({_id: soldier_id},
                    {$set: {action: newaction, actionTime: timestamp}});
  },
  stopaction: function(soldier_id) {
    check(soldier_id, String);
    //probably should add validation to make sure the calling client owns the soldier
    var timestamp = (new Date()).getTime();
    var soldier = Soldiers.findOne({_id: soldier_id});
    var timediff = timestamp - soldier.actionTime;
    timediff = Math.floor(timediff/1000);
    
    //do some checks
    if (timediff <= 5) {
      var msg = soldier.name + ' was not gone long enough to do anything';
      Chat.insert({name: 'Game', message: msg, time: timestamp});
    }
    else {
      var max = Math.floor(timediff/5);
      var toAdd = 0;
      for (var i = 0; i < max; i++) {
        toAdd += rnd(1,3);
      }
      var msg = soldier.name + ' returned with  ' + toAdd + ' ' + soldier.action;
      addResource(this.userId, soldier.action, toAdd);
      Chat.insert({name: 'Game', message: msg, time: timestamp});
    }

    //always do this last
    Soldiers.update({_id: soldier_id},
                    {$set: {action: "idle", actionTime: 0}});

  },
  usecp: function(soldier_id, stat) {
    check(soldier_id, String);
    check(stat, String);
    soldier = Soldiers.findOne({_id: soldier_id});
    if (!soldier || soldier.cp <= 0) return
    addStat(soldier._id, stat);
    Soldiers.update({_id: soldier._id},
                    {$inc: {cp: -1}});
  },
  levelup: function(soldier_id) {
    check(soldier_id, String);
    soldier = Soldiers.findOne({_id: soldier_id});
    if (!soldier) return
    var level = soldier.level;
    var exp = soldier.exp;
    var needed = exp2level[level];
    if (exp >= needed) {      
      var addhp = rnd(8,12) + Math.floor(soldier.level / 2);
      var newhp = soldier.maxhp + addhp;
      var addcp = rnd(3,5);
      Soldiers.update({_id: soldier_id},
                      {$inc: {level: 1, maxhp: addhp, cp: addcp}, $set: {hp: newhp}});
      var chance = rnd(1,4);
      if (chance == 1) addStat(soldier_id, 'agility');
      if (chance == 2) addStat(soldier_id, 'concentration');
      if (chance == 3) addStat(soldier_id, 'health');
      if (chance == 4) addStat(soldier_id, 'wisdom');
    }
  },
  sendchat: function(message) {
    check(message, String);
    player = Users.findOne( {_id: this.userId} );
    d = new Date();
    time = d.getTime();
    if (player) {
      Chat.insert({name: player.username, message: message, time: time});
    }
  },
  reset: function() {
    //for dev purposes only! only to be called manually
    //TODO: make admin accounts
    Users.remove({});
    Soldiers.remove({});
    Battles.remove({});
    Planets.update({}, {$set: {soldiers: [], soldierCount: 0}}, {multi: true});
  },
  resetBattles: function() {
    //for dev purposes only! only to be called manually
    //TODO: make admin accounts
    Users.update({}, {$set: {battle_id: null}}, {multi: true});
  }  
});

Meteor.setInterval(function () {
  var now = (new Date()).getTime();
  var idle_threshold = now - 20*1000;

  Users.update({last_keepalive: {$lt: idle_threshold}},
               {$set: {idle: true}},
               {multi: true});

//increase fuel by 1 every 1 seconds
  // Users.update({fuel: {$lt : 2000}},
  //               {$inc: {fuel: 50}}, 
  //               {multi: true});
  // Users.update({fuel: {$gt : 2000}},
  //               {$set: {fuel: 2000}}, 
  //               {multi: true});
  //generate soldiers
  populate();
  //soldier actions, training / harvest etc
  soldierTraining();
}, 30*1000);

//first start up intialize collections
Meteor.startup(function () {
  //do not want to persist chats at this point, keep db size down
  Chat.remove({});
  Battles.remove({});
  Users.update({}, {$set: {battle_id: null}}, {multi: true});
  Soldiers.update({}, {$set: {battle_id: null}}, {multi: true});
  populate();
  if (Planets.find().count() == 0) {
    Planets.insert({name: "Jute",
                    soldierCount: 0,
                    distances: {Jute: 0,
                                Ovas: 250,
                                Craeva: 600,
                                Antonia: 220,
                                Faelvaen: 700,
                                Gezz: 800,
                                Ord: 800,
                                Divaran: 1000}
                  });
    Planets.insert({name: "Ovas",
                    soldierCount: 0,
                    distances: {Jute: 250,
                                Ovas: 0,
                                Craeva: 350,
                                Antonia: 200,
                                Faelvaen: 500,
                                Gezz: 700,
                                Ord: 700,
                                Divaran: 750}
                  });
    Planets.insert({name: "Craeva",
                    soldierCount: 0, 
                    distances: {Jute: 600,
                                Ovas: 350,
                                Craeva: 0,
                                Antonia: 600,
                                Faelvaen: 700,
                                Gezz: 500,
                                Ord: 900,
                                Divaran: 750}
                  });
    Planets.insert({name: "Antonia",
                    soldierCount: 0, 
                    distances: {Jute: 220,
                                Ovas: 200,
                                Craeva: 600,
                                Antonia: 0,
                                Faelvaen: 400,
                                Gezz: 500,
                                Ord: 500,
                                Divaran: 800}
                  });
    Planets.insert({name: "Faelvaen",
                    soldierCount: 0, 
                    distances: {Jute: 700,
                                Ovas: 500,
                                Craeva: 700,
                                Antonia: 400,
                                Faelvaen: 0,
                                Gezz: 400,
                                Ord: 400,
                                Divaran: 400}
                  });
    Planets.insert({name: "Gezz",
                    soldierCount: 0,
                    distances: {Jute: 800,
                                Ovas: 700,
                                Craeva: 500,
                                Antonia: 500,
                                Faelvaen: 400,
                                Gezz: 0,
                                Ord: 700,
                                Divaran: 400}
                  });
    Planets.insert({name: "Ord",
                    soldierCount: 0,
                    distances: {Jute: 800,
                                Ovas: 700,
                                Craeva: 900,
                                Antonia: 500,
                                Faelvaen: 400,
                                Gezz: 500,
                                Ord: 0,
                                Divaran: 400}
                  });
    Planets.insert({name: "Divaran",
                    soldierCount: 0,
                    distances: {Jute: 1000,
                                Ovas: 750,
                                Craeva: 750,
                                Antonia: 800,
                                Faelvaen: 400,
                                Gezz: 400,
                                Ord: 400,
                                Divaran: 0}
                  });
  }
});