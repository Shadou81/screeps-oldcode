var spawnManager = require('spawn.manager');
var taskManager = require('task.manager');


var roomManager = {
    
    defaultHarvester: [WORK,WORK,CARRY,MOVE],
    defaultBodyWork: [WORK,CARRY,MOVE,MOVE],
    defaultBodyNoWork: [CARRY,CARRY,CARRY,MOVE,MOVE,MOVE],
    tier2: 550,
    tier3: 800,
    tier4: 1300,

    
    initializeNewRoom: function(roomName, spawnobj) {
        
        let room = Game.rooms[roomName];
        room.memory.new = true;
        room.memory.reserve = 2500;
        room.memory.spawn = {};
        room.memory.creeps = {};
        room.memory.spawn.primaryspawn = spawnobj.name;
        room.memory.sources = room.find(FIND_SOURCES);
        for (let i=0; i<room.memory.sources.length; i++){
            room.memory.sources[i].harvester = [];
        }
        room.memory.config = {
            tier: 1,
            reserve: 2500,
            maxwallandrampart: 1000000,
            carrierOffset: 1,
            harvesterbody: this.defaultHarvester,
            builderbody: this.defaultHarvester,
            repairerbody: this.defaultBodyWork,
            upgraderbody: this.defaultBodyWork,
            distributorbody: this.defaultBodyNoWork,
            carrierbody: this.defaultBodyNoWork,
            reserverbody: [CLAIM,MOVE],
            harvesterpersource: 3,
            repairers: 1,
            builders: 1,
            upgraders: 1,
            distributors: 1,
            carriers: 1,
            reservers: 0
        };
    },
    
    checkForNewSpawns: function() {
    
        for (let spawn in Game.spawns){
            let spawnobj = Game.spawns[spawn]
            let roomName = spawnobj.room.name;
            if (Memory.MyOwnedRooms[roomName] == undefined) {
                Memory.MyOwnedRooms[roomName] = {};
                this.initializeNewRoom(roomName, spawnobj);
                this.removeSatellite(roomName);
            }
            if (Memory.spawns[spawnobj.name] == undefined) {
                Memory.spawns[spawnobj.name] = {}
                Memory.spawns[spawnobj.name].queue = []
            }
        }
    },
    
    initialize: function() {
        
        this.checkForNewSpawns();
        this.initializeMemory();
        
    },
    
    deleteDeadCreeps: function(room){
        
        for (let creepName in room.memory.creeps){
            let creep = Game.creeps[creepName];
            if (!creep){
                delete room.memory.creeps[creepName]
            }
        }
        for (let i=0; i<room.memory.sources.length; i++){
            for (let j=0; j<room.memory.config.harvesterpersource; j++){
                let harvester = room.memory.sources[i].harvester[j];
                let harvestcreep = Game.getObjectById(harvester)
                if (!harvestcreep) {
                    room.memory.sources[i].harvester.splice(j, 1);
                }
            }
        }
    },
    
    initializeMemory: function() {
      
        for (let roomName in Memory.MyOwnedRooms) {
            let room = Game.rooms[roomName];
            this.updateTier(room)
            this.deleteDeadCreeps(room)
            if (room.memory.containers == undefined){
                room.memory.containers = {}
            }
            for (let id in room.memory.containers){
                let containercheck = Game.getObjectById(id)
                if (!containercheck){
                    delete room.memory.containers[id]
                }
            }
            let containers = taskManager.getStructures(room.name, 'storage');
            containers = _.filter(containers, (struct) => (struct.structureType != STRUCTURE_LINK))
            let reserve
            if (room.storage){
                reserve = 5000;
            }
            else {
                reserve = containers.length * 1500
            }
            room.memory.config.reserve = reserve
            for (let i=0; i<containers.length; i++){
                
                if (room.memory.containers[containers[i].id] == undefined){
                    room.memory.containers[containers[i].id] = {}
                }
            }
            let reservation
            for(let id in room.memory.containers){
                reservation = 0;
                for (let name in room.memory.creeps){
                    let creep = Game.creeps[name];
                    if ((creep.memory.task == id) && (creep.memory.role == 'carrier') && (!creep.memory.carrying)){
                            reservation += creep.carryCapacity;
                    }
                }
                room.memory.containers[id].reserved = reservation
            }
        }
    },
    
    addSatellite: function(roomName, flag){
        
        satelliteName = flag.pos.roomName;
        if (Memory.MyOwnedRooms[roomName][satelliteName] == undefined){
            satellite = Game.rooms[satelliteName]
            Memory.MyOwnedRooms[roomName][satelliteName] == satellite.controller.id;
            room = Game.rooms[roomName];
            roommem = Memory.MyOwnedRooms[room.name];
            roommem[satelliteName] = satellite.controller.id;
            sources = satellite.find(FIND_SOURCES);
            room.memory.sources = room.memory.sources.concat(sources);
            for (i=(room.memory.sources.length-(sources.length)); i<room.memory.sources.length; i++){
                room.memory.sources[i].harvester = []
            }
            flag.remove()
        }
        
        
        
    },
    
    manageClaims: function(){
        
        for (let target in Memory.ClaimTargets){
            let targetroom = Game.rooms[target];
            let sourceroom = Game.rooms[Memory.ClaimTargets[target].claimer];
            flag = Game.rooms[sourceroom.name + 'claim'];
            if (!targetroom){

                roomManager.sendExplorer(sourceroom, target);
            }
            if (targetroom){
                if (!targetroom.controller.my){
                    if (targetroom.controller.reservation){
                        if (targetroom.controller.reservation.username == 'Shadou'){
                            roomManager.sendClaimer(sourceroom, targetroom)
                        }
                        
                    }
                    else{
                        if (!targetroom.controller.owner || 
                        ((targetroom.controller.level == 1) && (targetroom.ticksToDowngradenumber < 200))){
                            roomManager.sendClaimer(sourceroom, targetroom);
                        }
                    }
                }
                else {
                    roomManager.removeSatellite(targetroom.name)
                    delete Memory.ClaimTargets[target];
                    flag.remove()
                }
            }
        }
    },
    
    updateTier: function(room){
        
        if(room.memory.new){
            containers = taskManager.getStructures(room.name, 'container')
            if (containers.length >= room.memory.sources.length){
                room.memory.new = false
                room.memory.config.builderbody = this.defaultBodyWork;
                for (creepName in room.memory.creeps){
                    creep = Game.creeps[creepName];
                    creep.memory.role = 'harvester'
                }
            }
            
        }
        
        if ((room.memory.config.tier == 1) && (room.energyCapacityAvailable >= this.tier2)){
            room.memory.config.tier = 2;
            room.memory.config.harvesterbody = [WORK,WORK,WORK,CARRY,MOVE,MOVE];
            room.memory.config.distributorbody = [CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.upgraderbody = [WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE];
            room.memory.config.carrierbody = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.builderbody = [WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.repairerbody = [WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.harvesterpersource = 2;
        }
        if ((room.memory.config.tier == 2) && (room.energyCapacityAvailable >= this.tier3)){
            room.memory.config.tier = 3;
            room.memory.config.harvesterbody = [WORK,WORK,WORK,WORK,WORK,WORK,CARRY,MOVE,MOVE,MOVE];
            room.memory.config.distributorbody = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.upgraderbody = [WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,MOVE,MOVE,MOVE];
            room.memory.config.carrierbody = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.builderbody = [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.repairerbody = [WORK,WORK,WORK,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.towerdistributors = 1;
            room.memory.config.harvesterpersource = 1;
            room.memory.config.reserverbody = [CLAIM,MOVE]
            room.memory.config.reservers = 2;
        }
        if ((room.memory.config.tier == 3) && (room.energyCapacityAvailable >= this.tier4)){
            room.memory.config.tier = 4;
            room.memory.config.carrierbody = [CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
            room.memory.config.reserverbody = [CLAIM,CLAIM,MOVE,MOVE];
            room.memory.config.reservers = 1;
        }
    },

    removeSatellite: function(satelliteName){
        
        for (roomName in Memory.MyOwnedRooms){
            for (satellite in Memory.MyOwnedRooms[roomName]){
                if (satellite == satelliteName){
                    room = Game.rooms[roomName];
                    satelliteobj = Game.rooms[satelliteName]
                    sources = room.memory.sources
                    for (i=(sources.length - 1); i >= 0; i--){
                        sourcecheck = Game.getObjectById(sources[i].id)
                        if (source.room.name == satelliteName){
                            room.memory.sources[i].splice
                        }
                    }
                    
                    ownedMemory = Memory.MyOwnedRooms[roomName];
                    delete ownedMemory[satelliteName]
                }
            }
        }
    },
    
    responseToFlags: function(room){
        
        for (flagname in Game.flags){
            flag = Game.flags[flagname]
            flagroom = Game.rooms[flag.pos.roomName]
            if (flag.name == (room.name + '+')){
                if (Game.rooms[flag.pos.roomName]){
                    if (!flagroom.controller.my){
                        this.addSatellite(room.name, flag);
                    }
                    if (flagroom.controller.my){
                        flag.remove()
                    }
                }
                else{
                    var explorer = _.filter(room.memory.creeps, (creep) => (creep.role == 'explorer') && (creep.task.roomName == flag.pos.roomName));
                    if (explorer.length < 1){
                        spawn = Game.spawns[room.memory.spawn.primaryspawn];
                        let order = new spawnManager.creepOrder(room.name, 'explorer', 5, flag.pos)
                        spawnManager.queueSpawn(order)
                    }
                }
            }
            if (flag.name == (room.name + '-')){
                this.removeSatellite(flag.pos.roomName);
            }
            if (flag.name == (room.name + 'war')){
                if (Memory.WarTargets == undefined){
                    Memory.WarTargets[flag.pos.roomName].attacker = room.name;
                }
            }
            if (flag.name == (room.name + 'peace')){
                delete Memory.Wartargets[flag.pos.roomName]
            }
            if (flag.name == (room.name + 'claim')){
                if (Memory.ClaimTargets[flag.pos.roomName] == undefined){
                    Memory.ClaimTargets[flag.pos.roomName] = {}
                    Memory.ClaimTargets[flag.pos.roomName].claimer = room.name;
                }
            }
        }
    },
    
    sendExplorer: function(room, targetName){
        
        
        roompos = new RoomPosition(25,25,targetName);
        var explorer = _.filter(room.memory.creeps, (creep) => (creep.role == 'explorer') && (creep.task.roomName == targetName));
        if (explorer.length < 1){
            place = new RoomPosition(25,25,targetName)
            let order = new spawnManager.creepOrder(room.name, 'explorer', 5, place)
            spawnManager.queueSpawn(order)
        }
    },
    
    sendClaimer: function(room, target){
        
        var claimer = _.filter(room.memory.creeps, (creep) => (creep.role == 'claimer') && (creep.task == target.controller.id))
        if (claimer.length == 0) {
            let order = new spawnManager.creepOrder(room.name, 'claimer', 3, target.controller.id)
            spawnManager.queueSpawn(order)
        }
    },

    manageSatellites: function(room){
        
        for (satelliteName in Memory.MyOwnedRooms[room.name]){
            satellite = Game.rooms[satelliteName]
            roommem = Memory.MyOwnedRooms[room.name];
            if (!satellite){
                roompos = new RoomPosition(25,25,satelliteName);
                var explorer = _.filter(room.memory.creeps, (creep) => (creep.role == 'explorer') && (creep.task.roomName == satelliteName));
                if (explorer.length < 1){
                    spawn = Game.spawns[room.memory.spawn.primaryspawn];
                    place = new RoomPosition(25,25,satelliteName)
                    let order = new spawnManager.creepOrder(room.name, 'explorer', 5, place)
                    spawnManager.queueSpawn(order)
                }
            }
            if (satellite){
                controller = satellite.controller
                if ((!controller.reservation) || (controller.reservation.ticksToEnd < 2000)){
                    reservername = []
                    for (let name in room.memory.creeps){
                        let checkmemory = room.memory.creeps[name]
                        if ((checkmemory.role == 'reserver') && (checkmemory.task == controller.id)){
                            reservername.push(name);
                        }
                    }
                    reserver = Game.creeps[reservername[0]]
                    if ((reservername.length < room.memory.config.reservers) || 
                    ((reserver.ticksToLive < 100) && (reservername.length < (room.memory.config.reservers + 1)))){
                        spawn = Game.spawns[room.memory.spawn.primaryspawn];
                        let order = new spawnManager.creepOrder(room.name, 'reserver', 9, controller.id)
                        spawnManager.queueSpawn(order)
                    }
                }
            }
            
        }
    },

    Tick: function() {
        
        for (let roomName in Memory.MyOwnedRooms){
            let room = Game.rooms[roomName];
            
            this.responseToFlags(room);
            this.manageSatellites(room);
            spawnManager.Tick(room);
        }
    },
    
    Tock: function(){
        
    },

}


module.exports = roomManager;