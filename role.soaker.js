var roleSoaker = {
    
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
        healerflagname = (creep.memory.originroom + 'healer');
        soakerflagname = creep.memory.task;
        healerflag = Game.flags[healerflagname];
        soakerflag = Game.flags[soakerflagname];
        creep.memory.healing = creep.memory.healing || false
        
        if (creep.hits <= creep.hitsMax * 0.70){
            creep.memory.healing = true
        }
        if (creep.hits == creep.hitsMax){
            creep.memory.healing = false
        }
        
        if (!creep.memory.healing){
            creep.moveTo(soakerflag, {reusePath: 20});
        }
        else {
            if (creep.pos.getRangeTo(healerflag) > 3)
            creep.moveTo(healerflag, {reusePath: 0});
        }
        
    }
}

module.exports = roleSoaker