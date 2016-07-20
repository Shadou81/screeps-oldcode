var roleReserver = {
    
    Tick: function(creep) {
        if (creep.memory.spawning){return}
        taskmem = creep.memory.task;
        task = Game.getObjectById(taskmem);
        if (task){
            if(creep.reserveController(task) == ERR_NOT_IN_RANGE){
                creep.moveTo(task, {reusePath: 20})
            }
        }
    },
}

module.exports = roleReserver;