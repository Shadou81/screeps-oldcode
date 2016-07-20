var taskManager = require('task.manager');


var roleCarrier = {
    
    Tick: function(creep) {
        //Get the creep's room
        if (creep.memory.spawning){return}

        room = Game.rooms[creep.memory.originroom];
        //Sanity check for new carriers
        if (creep.memory.carrying == undefined){
            creep.memory.carrying = false
        }
        //Sanity checks for transfers
        if ((!creep.memory.carrying) && (creep.carry.energy >= (creep.carryCapacity * room.memory.config.carrierOffset))){
            creep.memory.carrying = true
        }
        if ((creep.memory.carrying) && (creep.carry.energy < (creep.carryCapacity * 0.25))){
            creep.memory.carrying = false
        }
        //get the task
        taskmem = creep.memory.task;
        //Sanity check for resource decay
        task = Game.getObjectById(taskmem)
        if (!task){
            taskmem = 0
            creep.memory.task = 0
        }
        
        
        
        //If I don't have a task, I need one.
        if (!taskmem){
            taskmem = taskManager.assignCarrier(room.name, creep);
            creep.memory.task = taskmem;
        }
        //Do I have a task by now?
        if (taskmem){
            //Ok, I have a task. Do I need energy?
            if(!creep.memory.carrying){
                //Get the task's object
                taskmem = creep.memory.task
                task = Game.getObjectById(taskmem)
                //Ok, so is this task a container, or dropped energy? Let's try to pick it up.
                check = creep.pickup(task);
                if(check == ERR_NOT_IN_RANGE){
                    //it's not close enough. Get closer.
                    creep.moveTo(task)
                }
                if((check == OK) || (check == ERR_FULL)){
                    //OK, I got the thing.
                    creep.memory.task = 0;
                }
                if(check == ERR_INVALID_TARGET){
                    //It's not a thing we can pick up. This is a container.
                    check = creep.withdraw(task, RESOURCE_ENERGY)
                    switch (check) {
                        //I'm not close enough. Get closer.
                        case ERR_NOT_IN_RANGE: 
                            creep.moveTo(task); 
                            break;
                        //I got energy.
                        case ERR_FULL:
                            creep.memory.carrying = true;
                            creep.memory.task = 0
                            break;
                        case OK: 
                            creep.memory.task = 0;
                            break;
                        //Hey! This one's empty!
                        case ERR_NOT_ENOUGH_RESOURCES:
                            creep.memory.task = 0
                            break;
                    }
                }
            }
            //Or not?
            else {
                //get the task object
                taskmem = creep.memory.task
                task = Game.getObjectById(taskmem)
                //try to transfer energy to the container
                check = creep.transfer(task, RESOURCE_ENERGY)
                switch (check) {
                    //Not close enough, get closer.
                    case ERR_NOT_IN_RANGE: 
                        creep.moveTo(task); 
                        break;
                    //Hey, I'm empty!
                    case ERR_NOT_ENOUGH_RESOURCES:
                        creep.memory.task = 0;
                        creep.memory.carrying = false
                        break;
                    //Ok, transfer completed. Need a new task now.
                    case OK: 
                    //Hey, this one's full!
                    case ERR_FULL:
                        creep.memory.task = 0
                        break;
                }
            }
        }
        else {
            //Do I know where to go?
            if (!creep.memory.rally){
                //Ok, remember that.
                    flagname = ('Rally' + creep.memory.originroom + 'c')
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
};

module.exports = roleCarrier;