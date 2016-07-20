var taskManager = require('task.manager');


var roleHarvester = {

    Tick: function(creep) {
        
        //This code seems to have problems and break if it runs while the creep is spawning.
        if (creep.memory.spawning){return}
        
            //get the origin room
        room = Game.rooms[creep.memory.originroom]
        if (!creep.memory.assigned){
            task = taskManager.assignHarvester(room.name, creep);
            if (task){
                creep.memory.task = task
                creep.memory.assigned = true;
            }
        }
        task = creep.memory.task
        if (creep.memory.assigned){
            task = Game.getObjectById(task)
            if (task){
                if (creep.memory.linkpresent){
                    drop = Game.getObjectById(creep.memory.link)
                    if (!drop){
                        creep.memory.linkpresent = false;
                        drop = 0
                    }
                }
                if (!creep.memory.linkpresent){
                    drop = Game.getObjectById(creep.memory.container)
                }
                if (creep.memory.container){
                    if ((creep.pos.getRangeTo(drop) > 1) && (creep.pos.getRangeTo(drop) < 3)){
                        creep.moveTo(drop);
                        
                    }
                }
                check = creep.harvest(task);
                switch (check){
                    case ERR_NOT_IN_RANGE: creep.moveTo(task); break;
                    case OK:
                        if (!creep.memory.container){
                            container = taskManager.assignHarvester(room.name, creep);
                            creep.memory.container = container
                            drop = Game.getObjectById(container)
                        }
                        if (creep.memory.linkpresent) {
                            creep.transfer(drop, RESOURCE_ENERGY)
                            if (drop.energy == drop.energyCapacity){
                                target = taskManager.getStructures(room.name, 'storagereceivelink')
                                if (drop.cooldown == 0 && target.energy == 0){
                                    drop.transferEnergy(target)
                                }
                                else{
                                    if (creep.carry.energy == creep.carryCapacity){
                                        drop = Game.getObjectById(creep.memory.container);
                                    }
                                }
                                creep.transfer(drop, RESOURCE_ENERGY)
                            }
                        }
                        if (!creep.memory.linkpresent){
                            creep.transfer(drop, RESOURCE_ENERGY);
                        }
                    
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
    },

}
module.exports = roleHarvester;