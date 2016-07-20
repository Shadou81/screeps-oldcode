var spawnManager = require('spawn.manager');
var roomManager = require('room.manager');
var taskManager = require('task.manager');

var warManager = {
    
    Tick: function(){
        
        for (let roomName in Memory.MyOwnedRooms){
            let room = Game.rooms[roomName]
            
            let warriorflag = Game.flags[roomName + 'warrior'];
            let archerflag = Game.flags[roomName + 'archer'];
            let healerflag = Game.flags[roomName + 'healer'];
            let sapperflag = Game.flags[roomName + 'sapper'];
            let soakerflag = Game.flags[roomName + 'soaker'];
            
            if (warriorflag){
                var warriors = _.filter(room.memory.creeps, (creep) => (creep.role == 'warrior'));
                if (warriors.length < 3){
                    
                }
            }
            if (archerflag){
                
                
            }
            if (soakerflag){
                var soakers = _.filter(room.memory.creeps, (creep) => (creep.role == 'soaker'));
                room.memory.config.soakersrequest = room.memory.config.soakersrequest || 0;
                if (soakers.length < room.memory.config.soakersrequest){
                    soakerbody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
                    let order = new spawnManager.creepOrder(room.name, 'soaker', 15, soakerflag.name, soakerbody)
                    spawnManager.queueSpawn(order);
                }
            }
            if (healerflag){
                var healers = _.filter(room.memory.creeps, (creep) => (creep.role == 'healer'));
                room.memory.config.healersrequest = room.memory.config.healersrequest || 0;
                if (healers.length < room.memory.config.healersrequest){
                    healerbody = [TOUGH,MOVE,HEAL,HEAL,HEAL,HEAL,MOVE,MOVE,MOVE,MOVE];
                    let order = new spawnManager.creepOrder(room.name, 'healer', 15, healerflag.name, healerbody);
                    spawnManager.queueSpawn(order);
                }
            }
            if (sapperflag){
                var sappers = _.filter(room.memory.creeps, (creep) => (creep.role == 'sapper'));
                room.memory.config.sappersrequest = room.memory.config.sappersrequest || 0;
                if (sappers.length < room.memory.config.sappersrequest){
                    sapperbody = [WORK,WORK,WORK,WORK,WORK,MOVE,MOVE,MOVE,MOVE,MOVE]
                    let order = new spawnManager.creepOrder(room.name, 'sapper', 15, sapperflag.name, sapperbody);
                    spawnManager.queueSpawn(order);
                }
            }
            let hostiles = taskManager.getHostiles(room.name);
            if (hostiles.length > 0){
                var defenders = _.filter(room.memory.creeps, (creep) => (creep.role == 'defender'));
                if (defenders.length < hostiles.length){
                    defenderbody = [TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,RANGED_ATTACK,RANGED_ATTACK,RANGED_ATTACK,MOVE,MOVE,MOVE]
                    let order = new spawnManager.creepOrder(room.name, 'defender', 12, null, defenderbody);
                    spawnManager.queueSpawn(order);
                }

            }
            
        }
        
        
    }
    
    
}

module.exports = warManager;