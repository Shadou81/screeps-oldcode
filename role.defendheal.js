var taskManager = require('task.manager');

var roleDefendheal = {
    
    Tick: function(creep){
    
        if (creep.spawning){return};
        
        injured = taskManager.getInjured(creep.room.name)
        closestinjured = creep.pos.findClosestByRange(injured);
        
        if (creep.pos.getRangeTo(closestinjured) > 3){
            creep.moveTo(closestinjured);
        }
        else{
            check = creep.heal(closestinjured);
            switch (check){
                case OK:
                    if (creep.pos.getRangeTo(closestinjured) < 1){
                        creep.moveTo(closestinjured);
                    }
                    return;
                case ERR_NOT_IN_RANGE:
                    creep.moveTo(closestinjured);
                    return
                
                
            }
        }
    }
};
module.exports = roleDefendheal;