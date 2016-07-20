var roleHarvester = require('role.harvester');
var roleUpgrader = require('role.upgrader');
var roleBuilder = require('role.builder');
var roleDistributor = require('role.distributor');
var roleRepairer = require('role.repairer');
var roleCarrier = require('role.carrier');
var roleExplorer = require('role.explorer');
var roleReserver = require('role.reserver');
var roleCustom = require('role.custom');
var roleSapper = require('role.sapper');
var roleClaimer = require('role.claimer');
var roleSoaker = require('role.soaker');
var roleHealer = require('role.healer');
var roleDefender = require('role.defender');
var roleDefendheal = require('role.defendheal');

var creepManager = {
    
    initialize: function() {
        
        this.refreshcreeps()
    },
    
    refreshcreeps: function() {
        
        for (let creepName in Game.creeps){
            
            let creep = Game.creeps[creepName]
            if (creep.memory.originroom == null){
                creep.memory.originroom = creep.room.name;
            }
            let originroom = creep.memory.originroom;
            let room = Game.rooms[originroom];
            room.memory.creeps[creepName] = {
                originroom: originroom,
                role: creep.memory.role,
                task: creep.memory.task};

        }
        for (let creepName in Memory.creeps){
            let creep = Game.creeps[creepName];
            if (creep == null){
                let roomName = Memory.creeps[creepName].originroom;
                let room = Game.rooms[roomName];
                delete Memory.creeps[creepName];
            }
        }
    },
    
    Tick: function() {
        for(var name in Game.creeps) {
            
            var creep = Game.creeps[name]
            
            if (creep){
                switch(creep.memory.role) {
                
                    case 'smallharvester' :
                    case 'harvester' : roleHarvester.Tick(creep); continue;
                    case 'upgrader' : roleUpgrader.Tick(creep); continue;
                    case 'builder' : roleBuilder.Tick(creep); continue;
                    case 'distributor' : 
                    case 'smalldistributor' :
                    case 'towerdistributor': roleDistributor.Tick(creep); continue;
                    case 'repairer' : roleRepairer.Tick(creep); continue;
                    case 'carrier' : roleCarrier.Tick(creep); continue;
                    case 'explorer' : roleExplorer.Tick(creep); continue;
                    case 'reserver' : roleReserver.Tick(creep); continue;
                    case 'custom' : roleCustom.Tick(creep); continue;
                    case 'sapper' : roleSapper.Tick(creep); continue;
                    case 'claimer' : roleClaimer.Tick(creep); continue;
                    case 'soaker' : roleSoaker.Tick(creep); continue;
                    case 'healer' : roleHealer.Tick(creep); continue;
                    case 'defender' : roleDefender.Tick(creep); continue;
                }
            }
        }
    }
}

module.exports = creepManager