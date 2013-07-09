////////// Server only logic //////////
Accounts.onCreateUser(function(options, user) {
  user.fuel = 1000;
  user.planet = "Jute";
  user.idle = false;
  
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
                health: rnd(100,150),
                shield: 50,
                accuracy: rnd(30,50),
                owned: false}

  return newSoldier;
}

function populate() {
  Planets.find({soldierCount: {$lt: 6}}).forEach(function(p) {
    id = p._id;
    newSoldier = Soldiers.insert(createSoldier());
    Planets.update({_id: id},
                   {$push: {soldiers: newSoldier}, $inc: {soldierCount: 1}});    
  });
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
  keepalive: function (player_id) {
    check(player_id, String);
    Users.update({_id: player_id},
                 {$set: {last_keepalive: (new Date()).getTime(),
                         idle: false}});
  },
  travel: function(player_id, newPlanet) {
    check(player_id, String);
    check(newPlanet, String);
    player = Users.findOne( {_id: player_id} );
    currentPlanet = player.planet;
    distance = getDistance(currentPlanet, newPlanet);
    if (player.fuel >= distance) {
      Users.update({_id: player_id},
                   {$set: {planet: newPlanet}, $inc: {fuel: -(distance)}});
    }
  }
});

Meteor.setInterval(function () {
  var now = (new Date()).getTime();
  var idle_threshold = now - 70*1000; // 70 sec
  var remove_threshold = now - 60*60*1000; // 1hr

  Users.update({last_keepalive: {$lt: idle_threshold}},
                 {$set: {idle: true}});

  // XXX need to deal with people coming back!
  // Players.remove({$lt: {last_keepalive: remove_threshold}});

}, 30*1000);

Meteor.setInterval(function () {
//increase fuel by 1 every 1 seconds
  Users.update({fuel: {$lt : 2000}},
                {$inc: {fuel: 100}}, 
                {multi: true});
  populate();
}, 1000);

//first start up intialize collections
Meteor.startup(function () {
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