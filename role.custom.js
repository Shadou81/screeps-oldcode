var roleSapper = require('role.sapper');
var roleSoaker = require('role.soaker');
var roleHealer = require('role.healer');

var roleCustom = {
    
    Tick: function(creep){
        if (creep.memory.spawning){return}
        
        if (creep.getActiveBodyparts(ATTACK) > 0){
            creep.memory.role = 'warrior';
        }
        if (creep.getActiveBodyparts(RANGED_ATTACK) > 0){
            creep.memory.role = 'archer';
        }
        if (creep.getActiveBodyparts(HEAL) > 0){
            creep.memory.role = 'healer';
            roleHealer.Tick(creep);
        }
        if (creep.getActiveBodyparts(WORK) > 0){
            creep.memory.role = 'sapper';
            roleSapper.Tick(creep);
        }
        if (creep.getActiveBodyparts(TOUGH) >= creep.getActiveBodyparts(MOVE)){
            creep.memory.role = 'soaker';
            roleSoaker.Tick(creep);
        }
        
    }
    
    
}

module.exports = roleCustom;