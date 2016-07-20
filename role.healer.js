var taskManager = require('task.manager');

roleHealer = {
    Tick: function(creep){
        if (creep.spawning){return}
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
        
        flagname = (creep.memory.task)
        flag = Game.flags[flagname]
        
        if (creep.pos.getRangeTo(flag) <= 4){
            injured = taskManager.getInjured(creep.room.name)
            closestinjured = creep.pos.findClosestByRange(injured);
            if (injured.length > 0){
                if (closestinjured.pos.getRangeTo(flag) <= 4){
                    check = creep.heal(closestinjured);
                    switch (check){
                        case OK:
                            return;
                        case ERR_NOT_IN_RANGE:
                            if (flag.pos.getRangeTo(closestinjured) <= 4){
                                creep.moveTo(closestinjured, {reusePath:0});
                                if (creep.pos.getRangeTo(closestinjured) > 1){
                                    creep.rangedHeal(closestinjured);
                                }
                                else{
                                    creep.heal(closestinjured);
                                }
                                return
                            }
                    }
                }
            }
            else {
                if (creep.pos.getRangeTo(flag) > 3){
                    creep.moveTo(flag, {reusePath: 20});
                }
            }
        }
        else {
            creep.moveTo(flag, {reusePath: 20});
        }
    }
}

module.exports = roleHealer