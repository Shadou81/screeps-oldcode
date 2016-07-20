var warManager = require('war.manager');
var roomManager = require('room.manager');
var taskManager = require('task.manager');
var creepManager = require('creep.manager')

var globalManager = {
    
    initializeMemory: function() {
        
        if (Memory.MyOwnedRooms == null) {
           Memory.MyOwnedRooms = {};
        }
        if (Memory.spawns == null){
            Memory.spawns = {}
        }
        if (Memory.WarTargets == null) {
            Memory.WarTargets = {};
        }
        if (Memory.ClaimTargets == null) {
            Memory.ClaimTargets = {};
        }
        for (let roomName in Memory.MyOwnedRooms){
            let room = Game.rooms[roomName]
            if (room == undefined){
                delete Memory.MyOwnedRooms[roomName];
                delete Memory.rooms[roomName]
            }
        }
        
        
        creepManager.initialize();
        taskManager.initialize();
        roomManager.initialize();


    },
    
    Tick: function() {
        
        creepManager.Tick();
        warManager.Tick();
        roomManager.Tick();
        

    },
}
module.exports = globalManager;