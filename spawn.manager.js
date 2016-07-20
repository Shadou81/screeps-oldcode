var taskManager = require('task.manager');


var spawnManager = {
    
    emergencyHarvester: [WORK,WORK,CARRY,MOVE],
    emergencyDistributor: [CARRY,CARRY,MOVE,MOVE],
    
    
    queueSpawn: function(creepOrder){
        
        let roomName = creepOrder.roomName
        let room = Game.rooms[roomName]
        let spawnName = room.memory.spawn.primaryspawn
        let spawn = Game.spawns[spawnName]
        let orderMemory = spawn.memory.queue

        var duplicate = false
        for (let i=0; i<spawn.memory.queue.length; i++){
            if (_.isMatch(creepOrder, orderMemory[i])){
                duplicate = true
            }
        }
        if (!duplicate){
            orderMemory.push(creepOrder);
        }
    },
    
    creepOrder: function(roomName, type, priority, task = null, body = null) {
        
        this.roomName = roomName
        this.type = type
        this.priority = priority
        this.task = task
        this.body = body
        
    },
    
    spawnCreep: function(creepOrder, test){
        
        let roomName = creepOrder.roomName;
        let role = creepOrder.type;
        let priority = creepOrder.priority;
        let task = creepOrder.task;
        let body = creepOrder.body;
        let room = Game.rooms[roomName];
        let spawnName = room.memory.spawn.primaryspawn;
        let spawn = Game.spawns[spawnName];
        let config = room.memory.config;
        switch (creepOrder.type){
            case 'claimer':
                body = [CLAIM,MOVE];
                break;
            case 'harvester':
                body = config.harvesterbody;
                break;
            case 'smallharvester':
                body = this.emergencyHarvester;
                break;
            case 'towerdistributor':
            case 'distributor':
                body = config.distributorbody;
                break;
            case 'smalldistributor':
                body = this.emergencyDistributor;
                break;
            case 'builder':
                body = config.builderbody;
                break;
            case 'repairer':
                body = config.repairerbody;
                break;
            case 'upgrader':
                body = config.upgraderbody;
                break;
            case 'carrier':
                body = config.carrierbody;
                break;
            case 'explorer':
                body = [MOVE];
                break;
            case 'reserver':
                body = config.reserverbody;
                break;
            default:
                body = creepOrder.body;
                break;
        }
        if (test == 'test') {
            check = spawn.canCreateCreep(body, undefined)
            return check;
        }
        if (test == 'make') {
            newName = spawn.createCreep(body, undefined, {role: role, task: task, originroom: room.name})
            return newName;
        }
    },
    
    replaceDeadCreeps: function(room){
        if (room.memory.new){
            var builders = _.filter(room.memory.creeps, (creep) => (creep.role == 'builder'));
            if(builders.length < room.memory.config.builders) {
                constructions = taskManager.getConstructions(room.name);
                if (builders.length < constructions.length){
                    order = new this.creepOrder(room.name, 'builder', 1)
                    this.queueSpawn(order)
                }
            }
        }
        else{
            var harvestersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'harvester'));
            var distributorsearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'distributor'));
            if ((harvestersearch.length == 0) && (distributorsearch.length == 0)){
                let harvesterorder = new this.creepOrder(room.name, 'harvester', 1)
                let distributororder = new this.creepOrder(room.name, 'distributor', 2)
                this.queueSpawn(harvesterorder);
                this.queueSpawn(distributororder);
            }
            else {
                var carriersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'carrier'));
                var repairersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'repairer'));
                var upgradersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'upgrader'));
                var buildersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'builder'));
                var towersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'towerdistributor'));
                if (distributorsearch.length < room.memory.config.distributors){
                    let order = new this.creepOrder(room.name, 'distributor', 4);
                    this.queueSpawn(order);
                }
                if (harvestersearch.length < (room.memory.config.harvesterpersource * room.memory.sources.length)){
                    let order = new this.creepOrder(room.name, 'harvester', 5);
                    this.queueSpawn(order);
                }
                if (towersearch.length < room.memory.config.towerdistributors){
                    let order = new this.creepOrder(room.name, 'towerdistributor', 6)
                    this.queueSpawn(order);
                }
                if (repairersearch.length < room.memory.config.repairers){
                    let order = new this.creepOrder(room.name, 'repairer', 6);
                    this.queueSpawn(order);
                }
                if (upgradersearch.length < room.memory.config.upgraders){
                    let order = new this.creepOrder(room.name, 'upgrader', 7);
                    this.queueSpawn(order);
                }
                if (carriersearch.length < room.memory.config.carriers){
                    let order = new this.creepOrder(room.name, 'carrier', 8)
                    this.queueSpawn(order);
                }
                if (buildersearch.length < room.memory.config.builders){
                    constructions = taskManager.getConstructions(room.name);
                    if (buildersearch.length < constructions.length){
                        let order = new this.creepOrder(room.name, 'builder', 9);
                        this.queueSpawn(order)
                    }
                }
            }
        }
    },

    Tick: function(room) {
        
        this.replaceDeadCreeps(room);
        let spawnName = room.memory.spawn.primaryspawn
        let spawn = Game.spawns[spawnName]
        let memory = spawn.memory.queue
        
        if (memory.length > 0){
            let sortMemory = _.sortBy(memory, function(creep) {return (creep.priority)});
            spawn.memory.queue = sortMemory;
        }
        if (spawn) {
            spawning: {
                while(memory.length > 0){
                    creep = memory[0]
                    let order = new this.creepOrder(creep.roomName, creep.type, creep.priority, creep.task, creep.body)
                    let creepTest = this.spawnCreep(order, 'test');
                    switch(creepTest){
                        case OK:
                            let newName = this.spawnCreep(order, 'make')
                            newArray = memory.slice(0)
                            newArray.splice(0, 1)
                            spawn.memory.queue = newArray
                            console.log(room.name + ' is spawning a creep of type ' + creep.type + ': ' + newName)
                            if (order.role == 'harvester' || order.role == 'distributor'){
                                for (let creepname in room.memory.creeps){
                                    creep = Game.creeps[creepname]
                                    if (creep.memory.role = ('small' + order.role)){
                                        creep.suicide();
                                    }
                                }
                            }
                            break spawning;

                        case ERR_BUSY:
                            break spawning;
                        case ERR_INVALID_ARGS:
                            newArray = memory.slice(0)
                            newArray.splice(0, 1)
                            spawn.memory.queue = newArray
                            console.log(room.name + 'failed to create a creep of type ' + creep.type + ' because the body is defined badly.');
                            break;    
                        case ERR_RCL_NOT_ENOUGH:
                            newArray = memory.slice(0)
                            newArray.splice(0)
                            spawn.memory.queue = newArray
                            console.log(room.name + 'failed to create a creep of type ' + creep.type + ' because the room RCL is not high enough.');
                            break; 
                        case ERR_NOT_ENOUGH_ENERGY:
                            if (order.role == 'distributor'){
                                var distributorsearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'smalldistributor'));
                                if (distributorsearch.length == 0){
                                    let order = new this.creepOrder(room.name, 'smalldistributor', 2)
                                    this.queueSpawn(order)
                                }
                            }
                            if (order.role == 'harvester'){
                                var harvestersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'smallharvester'));
                                if (harvestersearch.length == 0){
                                    let order = new this.creepOrder(room.name, 'smallharvester', 1)
                                }
                            }
                            break spawning;
                        default: 
                            newArray = memory.slice(0)
                            newArray.splice(0)
                            spawn.memory.queue = newArray
                            console.log(room.name + 'failed to create a creep of type ' + creep.role + ' because of an unaccounted for error. Error code: '+ creepTest)
                            break;
                    }
                }
            }
        }
    },


    run: function(room) {
        
        roomspawn = room.memory.spawn.primaryspawn
        spawn = Game.spawns[roomspawn]
        if (spawn){
            if (room.memory.new){
                var builders = _.filter(room.memory.creeps, (creep) => (creep.role == 'builder'));
                if(builders.length < 1) {
                    if (spawn.canCreateCreep(room.memory.config.harvesterbody, undefined) == OK) {
                        var newName = spawn.createCreep(room.memory.config.harvesterbody, undefined, {role: 'builder', originroom: room.name, task: null});
                        console.log('Spawning new container builder: ' + newName);
                    }
                }
            }
            else {
                var harvestersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'harvester'));
                var distributorsearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'distributor'));
                if(harvestersearch.length < (room.memory.sources.length * room.memory.config.harvesterpersource)) {
                    if (spawn.canCreateCreep(room.memory.config.harvesterbody, undefined) == OK) {
                        var newName = spawn.createCreep(room.memory.config.harvesterbody, undefined, {role: 'harvester', originroom: room.name, task: null});
                        console.log('Spawning new harvester: ' + newName);
                    }
                    else {
                        if ((distributorsearch.length == 0) && (harvestersearch.length > 0) && (spawn.canCreateCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], undefined) == OK)) {
                            var smalldistributor = _.filter(room.memory.creeps, (creep) => (creep.role == 'smalldistributor'));
                            if (smalldistributor.length == 0){
                                var newName = spawn.createCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], undefined, {role: 'smalldistributor', originroom: room.name, task: null});
                                console.log('Emergency: Spawning new small distributor: ' + newName);
                            }
                        }
                        if ((harvestersearch.length == 0) && (distributorsearch.length == 0) && (spawn.canCreateCreep([WORK,CARRY,MOVE,MOVE], undefined) == OK)) {
                        var newName = spawn.createCreep([WORK,CARRY,MOVE,MOVE], undefined, {role: 'harvester', originroom: room.name, task: null});
                        console.log('Spawning new harvester: ' + newName);
                        }
                    }
                    
                }
                else {
                    if(distributorsearch.length < room.memory.config.distributors) {
                        if (spawn.canCreateCreep(room.memory.config.distributorbody, undefined) == OK) {
                            var newName = spawn.createCreep(room.memory.config.distributorbody, undefined, {role: 'distributor', originroom: room.name, task: null});
                            console.log('Spawning new distributor: ' + newName);
                        }
                        else {
                            if (spawn.canCreateCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], undefined) == OK) {
                                var newName = spawn.createCreep([CARRY,CARRY,CARRY,MOVE,MOVE,MOVE], undefined, {role: 'distributor', originroom: room.name, task: null});
                                console.log('Spawning new small distributor: ' + newName);
                            }
                        }
                    }
                    else {
                        var carriersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'carrier'));
                        if(carriersearch.length < room.memory.config.carriers) {
                            if(spawn.canCreateCreep(room.memory.config.carrierbody, undefined) == OK) {
                                var newName = spawn.createCreep(room.memory.config.carrierbody, undefined, {role: 'carrier', originroom: room.name, task: null});
                                console.log('Spawning new carrier: ' + newName);
                            }
                        }
                        var repairersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'repairer'));
                        if(repairersearch.length < room.memory.config.repairers) {
                            if (spawn.canCreateCreep(room.memory.config.repairerbody, undefined) == OK){
                                var newName = spawn.createCreep(room.memory.config.repairerbody, undefined, {role: 'repairer', originroom: room.name, task: null});
                                console.log('Spawning new repairer: ' + newName);
                            }
                        }
                        var upgradersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'upgrader'));
                        if(upgradersearch.length < room.memory.config.upgraders) {
                            if (spawn.canCreateCreep(room.memory.config.upgraderbody, undefined) == OK) {
                                var newName = spawn.createCreep(room.memory.config.upgraderbody, undefined, {role: 'upgrader', originroom: room.name, task: null});
                                console.log('Spawning new upgrader: ' + newName);
                            }
                        }
                        var buildersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'builder'));
                        if(buildersearch.length < room.memory.config.builders) {
                            if (spawn.canCreateCreep(room.memory.config.builderbody, undefined) == OK) {
                                var newName = spawn.createCreep(room.memory.config.builderbody, undefined, {role: 'builder', originroom: room.name, task: null});
                                console.log('Spawning new builder: ' + newName);
                            }
                        }
                        var towersearch = _.filter(room.memory.creeps, (creep) => (creep.role == 'towerdistributor'));
                        if(towersearch.length < room.memory.config.towerdistributors) {
                            if (spawn.canCreateCreep(room.memory.config.distributorbody, undefined) == OK) {
                                var newName = spawn.createCreep(room.memory.config.distributorbody, undefined, {role: 'towerdistributor', originroom: room.name, task: null});
                                console.log('Spawning new tower distributor: ' + newName);
                            }
                        }
                    }
                }
            }
        }
    },
}        
module.exports = spawnManager;