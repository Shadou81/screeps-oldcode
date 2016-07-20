var taskManager = require('task.manager');

var roleDistributor = {

    Tick: function(creep) {
        if (creep.memory.spawning){return}
        
        //Get the task from memory and the room object.
        taskmem = creep.memory.task
        var room = Game.rooms[creep.memory.originroom];
        
        //Sanity check for new distributors
        if (creep.memory.distributing == undefined){
            creep.memory.distributing = true;
            creep.memory.container = 0
        }
        //Sanity check for taking from containers
        if ((!creep.memory.distributing) && (creep.carry.energy > creep.carryCapacity*0.9)){
            creep.memory.distributing = true;
            creep.memory.task = taskManager.assignDistributor(room.name, creep);
        }
        //I need a distributor task
        if (!taskmem){
            creep.memory.distributing = true;
            creep.memory.task = taskManager.assignDistributor(room.name, creep);
        }
        
        //I'm pretty low on energy. I should get more.
        if (creep.carry.energy < (creep.carryCapacity * 0.1)) {
            creep.memory.distributing = false;
        }

        //Do I have a task?
        if (taskmem) {
        
            //Get the task object
            task = Game.getObjectById(taskmem)
        
            //Do I have energy?
            if(creep.memory.distributing){
                
                //Is this task already done?
                if (task.energy == task.energyCapacity){
                
                    //Task is refilled. Need a new task now.
                    taskmem = taskManager.assignDistributor(room.name, creep);
                    creep.memory.task = taskmem;
                    task = Game.getObjectById(taskmem)
                }
                
                //Try to refill the task.
                check = creep.transfer(task, RESOURCE_ENERGY);
                switch (check) {
        
                    //Transfer completed. Next task
                    case OK: 
                        break;
        
                    //Not close enough. Get closer.
                    case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
        
                    //I don't have any energy.
                    case ERR_NOT_ENOUGH_RESOURCES: creep.memory.distributing = false; break;
        
                    //This isn't something I can refill!
                    case ERR_INVALID_TARGET: creep.memory.task = 0; break;
                }
            }
            
            //I don't have energy.
            if (!creep.memory.distributing) {
            
                //Where's the closest container?
                if (!creep.memory.container){
                    creep.memory.container = taskManager.assignDistributor(room.name, creep)
                }
                //Did I find a container?
                if (creep.memory.container){
                    //Get the container object
                    task = Game.getObjectById(creep.memory.container);
                    
                    //Try to take energy
                    check = creep.withdraw(task, RESOURCE_ENERGY);
                    switch (check) {
                
                        //Not close enough, get closer.
                        case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                
                        //I got energy.
                        case ERR_FULL:
                            creep.memory.distributing = true;
                            creep.memory.container = 0
                            break;
                        case OK:
                            creep.memory.container = 0
                            break;
                        //Hey! This one's empty. I need another.
                        case ERR_NOT_ENOUGH_RESOURCES: creep.memory.container = taskManager.assignDistributor(room.name, creep); break;
                    }
                }
                else {
                    if (!creep.memory.rally){
                       //Ok, remember that.
                        flagname = ('Rally' + creep.memory.originroom)
                        creep.memory.rally = flagname;

                    }
                    //Get the flag object.
                    rally = Game.flags[creep.memory.rally]
                    //Get close.
                    if (creep.pos.getRangeTo(rally) > 2){
                    creep.moveTo(rally)
                    }
                }
            }
        }
        //I don't have a task yet. Let's check the links.
        if (!taskmem && (creep.memory.role != 'towerdistributor')) {
            if (!creep.memory.receivelink){
                //let's consign the link to memory...
                receivelink = taskManager.getStructures(room.name, 'storagereceivelink');
                if (receivelink){
                    creep.memory.receivelink = receivelink.id
                }
            }
            if (creep.memory.receivelink){
                if (!creep.memory.distributing){
                    if (creep.memory.receivelink){
                        link = Game.getObjectById(creep.memory.receivelink);
                        if (link.energy > 0){
                            taskmem = creep.memory.receivelink;
                            if (creep.withdraw(link, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                                creep.moveTo(link);
                            }
                        }
                    }
                }
                if (creep.memory.distributing){
                    storage = room.storage;
                    taskmem = storage.id
                        if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE){
                        creep.moveTo(storage)
                    }
                }
            }
        }
        //There are no tasks. Getting out of the way.
        if (!taskmem) {
            //Do I know where to go?
            if (!creep.memory.rally){
                //Ok, remember that.
                flagname = ('Rally' + creep.memory.originroom)
                creep.memory.rally = flagname;

            }
            //Get the flag object.
            rally = Game.flags[creep.memory.rally]
            //Get close.
            if (creep.pos.getRangeTo(rally) > 2){
            creep.moveTo(rally)
            }
        
        }
        
    },


    run: function(creep) {
        
        if(creep.carry.energy < (creep.carryCapacity * 0.1)) {
            var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_STORAGE) &&
                    structure.store[RESOURCE_ENERGY] > 0;
                }
            });
            if (container) {
                if (container.transfer(creep, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                creep.moveTo(container);   
                }
            }
            else {
                var targets = creep.room.find(FIND_FLAGS);
                creep.moveTo(targets[0]);
            }
        }
        else {
            hostiles = creep.room.find(FIND_HOSTILE_CREEPS)

            var targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return ((structure.structureType == STRUCTURE_EXTENSION || 
                                 structure.structureType == STRUCTURE_SPAWN) &&
                            structure.energy < structure.energyCapacity);
                    }
            });
            if (!targets){
                targets = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (structure) => {
                        return (structure.structureType == STRUCTURE_TOWER &&
                            structure.energy < structure.energyCapacity);
                    }
                });
            }
            if(targets) {
                if(creep.transfer(targets, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                    creep.moveTo(targets);
                }
            }
            else {
                var targets = creep.room.find(FIND_FLAGS);
                    creep.moveTo(targets[0]);
            }
        }
	},
};

module.exports = roleDistributor;