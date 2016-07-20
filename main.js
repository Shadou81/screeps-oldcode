var globalManager = require('global.manager');


module.exports.loop = function () {



    for (let struct in Game.structures){
        let structobj = Game.structures[struct];
        if (structobj.structureType == STRUCTURE_TOWER) {
            let hostile = structobj.room.find(FIND_HOSTILE_CREEPS);
            if(hostile.length > 0) {
                structobj.attack(hostile[0]);
            }
        }
    }
    globalManager.initializeMemory();
    globalManager.Tick();
    

}