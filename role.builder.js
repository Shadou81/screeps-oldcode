var taskManager = require('task.manager');

var roleBuilder = {

    Tick: function(creep) {
        
        if (creep.memory.spawning){return}
        
        //Get the task and room object
        taskmem = creep.memory.task
        room = Game.rooms[creep.memory.originroom];
        
        //Sanity check, only runs on new creeps
        if(creep.memory.building == undefined) {
            creep.memory.building = false;
        }
        //Another sanity check, because construction workers are so mentally balanced.
        if((!creep.memory.building) && (creep.carry.energy == creep.carryCapacity)){
            creep.memory.building = true;
            creep.memory.container = 0
        }
        
        //Is this a new room?
        if (room.memory.new == true){
            //Do I have a task?
            if (!taskmem) {
                //I need a construction task.
                creep.memory.building = true;
                taskmem = taskManager.assignBuilder(room.name, creep);
            }
            //Put our task into memory,
            creep.memory.task = taskmem
            //Get the task object
            task = Game.getObjectById(taskmem)
            //Do we have a task and energy?
            if (creep.memory.building){
                //Try to build.
                check = creep.build(task);
                switch (check) {
                    //Building
                    case OK: break;
                    //Not close enough. Get closer.
                    case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                    //I don't have any energy.
                    case ERR_NOT_ENOUGH_RESOURCES: 
                        creep.memory.building = false
                        break;
                    //Construction finished. Get a new task.
                    case ERR_INVALID_TARGET: 
                        creep.memory.task = taskManager.assignBuilder(room.name, creep); 
                        break;
                }
                if (creep.pos.getRangeTo(task) > 0){
                    creep.moveTo(task)
                    
                }
                    
            }
            //By now we have a task, but we have no energy.
            if (!creep.memory.building){
                //Do we know where a source is?
                if (!creep.memory.source) {
                    //Find a source, assign its ID to memory.
                    source = task.pos.findClosestByRange(FIND_SOURCES); 
                    creep.memory.source = source.id;
                }
                //Get the source object
                source = Game.getObjectById(creep.memory.source)
                //Try to harvest
                check = creep.harvest(source);
                switch (check) {
                    //Harvesting.
                    case OK: break;
                    //Not close enough. Get closer.
                    case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                    //Hey! This isn't a source! Ok, start over.
                    case ERR_INVALID_TARGET: creep.memory.task = 0; creep.memory.source = 0; break;
                }
            }
        }
        else{
            //Do I have a task?
            if (!taskmem){
                //I need a construction site.
                creep.memory.building = true;
                taskmem = taskManager.assignBuilder(room.name, creep);
                creep.memory.task = taskmem
            }
            //Ok, I have a task.
            if (taskmem) {
                //Get the task object
                task = Game.getObjectById(taskmem)
                //Do I have energy?
                if(creep.memory.building){
                    //Try to build.
                    check = creep.build(task);
                    switch (check) {
                        //Building.
                        case OK: break;
                        //Not close enough. Get closer.
                        case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                        //I don't have enough energy. Get some.
                        case ERR_NOT_ENOUGH_RESOURCES: creep.memory.building = false; break;
                        //Construction finished.
                        case ERR_INVALID_TARGET: creep.memory.task = 0; break;
                    }
                }
                //I need energy.
                if (!creep.memory.building){
                    //Do I know where the nearest container with energy is?
                    if (!creep.memory.container){
                        //Get the nearest container with energy.
                        creep.memory.container = taskManager.assignBuilder(room.name, creep)
                    }
                    //I know where the container is.
                    if (creep.memory.container){
                        //Get the container's object
                        task = Game.getObjectById(creep.memory.container);
                        //Try to take energy
                        check = (creep.withdraw(task, RESOURCE_ENERGY));
                        switch (check) {
                            //We're not close enough. Get closer.
                            case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                            //We got energy.
                            case ERR_FULL: 
                                creep.memory.building = true;
                                creep.memory.container = 0
                                break;
                            case OK: creep.memory.container = 0;
                            //Hey! This container's empty. Give me another one.
                            case ERR_NOT_ENOUGH_RESOURCES: creep.memory.container = taskManager.assignBuilder(room.name, creep); break;
                        }
                    }
                    //I still don't know what container to pull from.
                    else {
                        //Where's the flag?
                        if (!creep.memory.rally){
                            //Ok, remember that.
                            flagname = ('Rally' + creep.memory.originroom)
                            creep.memory.rally = flagname;
                        }
                        //Get the flag's object
                        rally = Game.flags[creep.memory.rally]
                        //Get close to it.
                        if (creep.pos.getRangeTo(rally) > 2){
                        creep.moveTo(rally);
                        }
                    }
                }
            }
            //I still don't have a task. I need to get out of the way.
            else {
                //Where's the flag?
                if (!creep.memory.rally){
                    //Ok, remember that.
                    flagname = ('Rally' + creep.memory.originroom)
                    creep.memory.rally = flagname
                }
                //Get the flag's object
                rally = Game.flags[creep.memory.rally]
                //Get close to it.
                if (creep.pos.getRangeTo(rally) > 2){
                creep.moveTo(rally)
                }
            }
        }
    },
};

module.exports = roleBuilder;