var taskManager = require('task.manager');


var roleRepairer = {

    Tick: function(creep) {
        if (creep.memory.spawning){return}
        //find the current task and the origin room
        taskmem = creep.memory.task;
        let room = Game.rooms[creep.memory.originroom];
        //Sanity check, runs on new creeps
        if((creep.memory.repairing == undefined) && (creep.carry.energy == 0)) {
            creep.memory.repairing = false;
	    }
	    //This may be unnecessary.
	    if(!creep.memory.repairing && (creep.carry.energy == creep.carryCapacity)) {
	        creep.memory.repairing = true;
	        creep.memory.overhalf = true;
	        creep.memory.container = 0
	    }
	    
	    if (taskmem){
            task = Game.getObjectById(taskmem);
            //Sanity check for cross-room tasks.
            if (!task){
                task = 0
                creep.memory.task = 0
            }
            
    	    //check the task. Is it done?
	        if(task.hits == task.hitsMax) {
	            //I need a different task.
	            taskmem = taskManager.assignRepairer(room.name, creep);
	            creep.memory.task = taskmem;
            }
	    }
	    //Do I have a task?
	    if (!taskmem){
	        //I need a repair task.
	        creep.memory.repairing = true
            taskmem = taskManager.assignRepairer(room.name, creep);
            creep.memory.task = taskmem;
	    }

	    //Ok, now do I have a task?
	    if (taskmem){
	        //Do I have energy for this?
    	    if(creep.memory.repairing) {
    	        //Get the task object
    	        task = Game.getObjectById(taskmem)
    	        //Try to repair
    	        check = creep.repair(task);
                switch (check) {
                    //repairing
                    case OK: break;
                    //Not close enough. Get closer.
                    case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                    //I'm out. Get more energy.
                    case ERR_NOT_ENOUGH_RESOURCES: creep.memory.repairing = false; break;
                    //Sanity check. Is this a repairable structure?
                    case ERR_INVALID_TARGET: creep.memory.task = 0; break;
                }
                //I've been repairing for a while. Is this still the most important task?
	            if (creep.memory.overhalf == true) {
                    if (creep.carry.energy <= (creep.carryCapacity * 0.5)) {
                        creep.memory.task = 0
                        taskmem = taskManager.assignRepairer(room.name, creep);
                        creep.memory.task = taskmem;
                        creep.memory.overhalf = false;
                    }
                }
    	    }
    	    //I don't have energy. I need some.
    	    else {
    	        //I need to find a container.
                if (!creep.memory.container){
                    containermem = taskManager.assignRepairer(room.name, creep);
                    creep.memory.container = containermem
                }
                //Is there a container?
                
                containermem = creep.memory.container;
                if (containermem){
                    //Get the container's object
                    task = Game.getObjectById(containermem)
                    //Try to take energy.
                    check = creep.withdraw(task, RESOURCE_ENERGY);
                    switch (check) {
                        //Not close enough. Get closer.
                        case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                        //I got energy.
                        case ERR_FULL: 
                            creep.memory.repairing = true
                            creep.memory.overhalf = true
                            creep.memory.container = 0
                            break;
                        case OK: creep.memory.container = 0; break
                        //Hey! This container's empty. I need a new one.
                        case ERR_NOT_ENOUGH_RESOURCES: creep.memory.container = taskManager.assignRepairer(room.name, creep); break;
                    }
                }
                //I can't find a container! I'm going home. >:(
                else {
                    //Do I know where the flag is?
                    if (!creep.memory.rally){
                        //Ok, remember that.
                        flagname = ('Rally' + room.name)
                        creep.memory.rally = flagname;

                    }
                    //Get the flag object,
                    flagname = creep.memory.rally;
                    rally = Game.flags[flagname];
                    //Get close.
                    if (creep.pos.getRangeTo(rally) > 2){creep.moveTo(rally);}
                }
	        }
	    }
	    //I still don't have a task.
	    else {
	        //Do I know where the flag is?
            if (!creep.memory.rally){
                //Ok, remember that.
                flagname = ('Rally' + room.name)
                creep.memory.rally = flagname;

            }
            //Get the flag object,
            flagname = creep.memory.rally;
            rally = Game.flags[flagname];
            //Get close.
            if (creep.pos.getRangeTo(rally) > 2){creep.moveTo(rally);}
        }
    },
}

module.exports = roleRepairer;

