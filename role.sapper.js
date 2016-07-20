var taskManager = require('task.manager');

var roleSapper = {
    Tick: function(creep){
        if (creep.memory.spawning){return}
        creep.memory.waypoint = creep.memory.waypoint || (creep.memory.originroom + 'waypoint')
        creep.memory.reachedwaypoint = creep.memory.reachedwaypoint || false;
        waypoint = Game.flags[creep.memory.waypoint]
        if ((!creep.memory.reachedwaypoint) && (creep.pos.getRangeTo(waypoint) > 2)){
            creep.moveTo(waypoint);
            return
        }
        else {
            creep.memory.reachedwaypoint = true;
        }
        
        
        target = creep.memory.task;
        targetflag = Game.flags[target]

        if (targetflag){
            targetroomName = targetflag.pos.roomName;
            targetroom = Game.rooms[targetroomName];
            room = creep.room
            spawn = room.find(FIND_HOSTILE_SPAWNS);
            
            nearesttower = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: (structure) => {
                    return (structure.structureType == STRUCTURE_TOWER);}});
            
            /*if (creep.dismantle(nearesttower) == ERR_NOT_IN_RANGE){
                if (creep.moveTo(nearesttower) == ERR_NO_PATH){
                    obstructions = taskManager.getStructures(targetroom.name, 'obstructions');
                    mypos = creep.pos;
                    obstructions = _.filter(obstructions, function(struct) {return (struct.pos.getRangeTo(mypos) < 3)});
                    obstructions = _.sortBy(obstructions, function(struct) {return (struct.pos.getRangeTo(mypos))});
                    obstructions = _.sortBy(obstructions, function(struct) {return (struct.hits)});
                        if (obstructions.length > 0){
                        task = Game.getObjectById(obstructions[0].id)
                        if (creep.pos.getRangeTo(task)>1){
                            creep.moveTo(task);
                        }
                        if (creep.pos.getRangeTo(task) == 1){
                            creep.dismantle(task)
                        }
                    }
                }
            }*/
            if ((spawn.length > 0) && (targetflag.pos.roomName == creep.room.name)){
                if (creep.dismantle(spawn[0]) == ERR_NOT_IN_RANGE){

                    if (creep.moveTo(spawn[0]) == ERR_NO_PATH){
                        obstructions = taskManager.getStructures(targetroom.name, 'obstructions');
                        mypos = creep.pos;
                        obstructions = _.filter(obstructions, function(struct) {return (struct.pos.getRangeTo(mypos) < 3)});
                        obstructions = _.sortBy(obstructions, function(struct) {return (struct.pos.getRangeTo(mypos))});
                        obstructions = _.sortBy(obstructions, function(struct) {return (struct.hits)});

                        if (obstructions.length > 0){
                            task = Game.getObjectById(obstructions[0].id)
                            if (creep.pos.getRangeTo(task)>1){
                                creep.moveTo(task);
                            }
                            if (creep.pos.getRangeTo(task) == 1){
                                creep.dismantle(task)
                            }
                        }
                        
                    }
                }
            }
            if (!nearesttower && (spawn.length == 0)) {
                creep.moveTo(targetflag)
            }
        }
    }
    
}

module.exports = roleSapper;