var taskManager = require('task.manager');

var roleUpgrader = {

    Tick: function(creep) {
        if (creep.memory.spawning){return}
        
        taskmem = creep.memory.task
        room = Game.rooms[creep.memory.originroom];

        if((!creep.memory.upgrading) && (creep.carry.energy == creep.carryCapacity)) {
                creep.memory.upgrading = true;
        }
        if (!taskmem){
            taskmem = taskManager.assignUpgrader(room.name, creep);
            creep.memory.task = taskmem;
        }
        if (taskmem) {
            task = Game.getObjectById(taskmem)
            if(creep.memory.upgrading){
                var check = creep.upgradeController(task);
                switch (check) {
                    case OK: 
                        if (creep.pos.getRangeTo(room.controller) > 2){
                            creep.moveTo(room.controller);
                        }
                        break;
                    case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                    case ERR_NOT_ENOUGH_RESOURCES: creep.memory.upgrading = false; creep.memory.container = taskManager.assignUpgrader(room.name, creep); break;
                    case ERR_INVALID_TARGET: creep.memory.task = 0; break;
                }
            }
            else {
                if (!creep.memory.container){
                    creep.memory.container = taskManager.assignUpgrader(room.name, creep)
                }
                task = Game.getObjectById(creep.memory.container);
                if (task){
                    var check = creep.withdraw(task, RESOURCE_ENERGY);
                    switch (check) {
                        case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                        case OK:
                        case ERR_NOT_ENOUGH_RESOURCES: creep.memory.container = taskManager.assignUpgrader(room.name, creep); break;
                    }
                }
            }
        }
    },
    
    
    run: function(creep) {
	
		if(creep.memory.upgrading && creep.carry.energy == 0) {
            creep.memory.upgrading = false;
	    }
	    if(!creep.memory.upgrading && creep.carry.energy == creep.carryCapacity) {
	        creep.memory.upgrading = true;
	    }
	
	    if(!creep.memory.upgrading) {
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
        }
        else {
            if(creep.upgradeController(creep.room.controller) == ERR_NOT_IN_RANGE) {
                creep.moveTo(creep.room.controller);
            }
        }
	},
};

module.exports = roleUpgrader;