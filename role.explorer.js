var roleExplorer = {
    
    Tick: function(creep) {
        if (creep.memory.spawning){return}
        
        place = creep.memory.task
        task = new RoomPosition(place.x, place.y, place.roomName)
        
        if (creep.pos.getRangeTo(task) > 1){
            creep.moveTo(task, {reusePath: 20});
        }
        
    },
}

module.exports = roleExplorer;