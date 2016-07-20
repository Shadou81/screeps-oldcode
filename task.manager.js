var taskManager = {
    
    initialize: function() {
        
        roomstructures = {}; 
        this.roomobstructions = {};
        constructions = {}; 
        dropped = {};
        hostiles = {};
        injured = {}
        
    },
    
    
    getConstructions: function(roomName){
        
        var room = Game.rooms[roomName];
        if (constructions[room.name] == undefined) {
            constructions[room.name] = (room.find(FIND_MY_CONSTRUCTION_SITES));
            if (Object.keys(Memory.MyOwnedRooms[room.name]).length > 0){
                for (satellite in Memory.MyOwnedRooms[room.name]){
                    satelliteroom = Game.rooms[satellite];
                    if (satelliteroom){
                        satelliteconst = satelliteroom.find(FIND_MY_CONSTRUCTION_SITES)
                        constructions[room.name] = constructions[room.name].concat(satelliteconst);
                    }
                }
            }
        }
        return constructions[room.name];
    },
    
    getHostiles: function(roomName){
        var room = Game.rooms[roomName];
        if (hostiles[roomName] == undefined){
            hostiles[roomName] = room.find(FIND_HOSTILE_CREEPS);
        }
        return hostiles[roomName];
    },
         
    getInjured: function(roomName){
        var room = Game.rooms[roomName]
        if (injured[roomName] == undefined){
            injured[roomName] = room.find(FIND_MY_CREEPS);
            injured[roomName] = _.filter(injured[roomName], (creep) => (creep.hits < creep.hitsMax))
        }
        return injured[roomName];
    },
    
    getDropped: function(roomName){
        
        var room = Game.rooms[roomName];
        if (dropped[room.name] == undefined) {
            dropped[room.name] = (room.find(FIND_DROPPED_ENERGY));
            if (Object.keys(Memory.MyOwnedRooms[room.name]).length > 0){
                for (satellite in Memory.MyOwnedRooms[room.name]){
                    satelliteroom = Game.rooms[satellite];
                    if (satelliteroom){
                        satellitedrop = satelliteroom.find(FIND_DROPPED_ENERGY)
                        dropped[room.name] = dropped[room.name].concat(satellitedrop);
                    }
                }
            }
        }
        return dropped[room.name];
    },
    
    getStructures: function(roomName, type){
        
        
        var room = Game.rooms[roomName];
        
        if (roomstructures[room.name] == undefined) {
            roomstructures[room.name] = (room.find(FIND_STRUCTURES));
            if (Memory.MyOwnedRooms[room.name] != undefined){
                if (Object.keys(Memory.MyOwnedRooms[room.name]).length > 0){
                    for (satellite in Memory.MyOwnedRooms[room.name]){
                        satelliteroom = Game.rooms[satellite];
                        if (satelliteroom){
                            satellitesites = satelliteroom.find(FIND_STRUCTURES)
                            roomstructures[room.name] = roomstructures[room.name].concat(satellitesites);
                        }
                    }
                }
            }
        }
    
        switch (type){
            
            case 'obstructions' : 
                if (this.roomobstructions[roomName] == undefined){
                    this.roomobstructions[roomName] = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_WALL || struct.structureType == STRUCTURE_RAMPART));
                }
                return this.roomobstructions[roomName];
            case 'link' :
                var links = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_LINK));
                return links
            case 'storagereceivelink':
                var links = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_LINK));
                var storage = room.storage
                for (let i=0; i<links.length; l++){
                    linkobj = links[i];
                    if (storage.pos.getRangeTo(linkobj) == 1){
                        return linkobj;
                    }
                }
                return 0
            case 'repair' : 
                var repairs = _.filter(roomstructures[roomName], (struct) => ((struct.hits <= (struct.hitsMax - 1500)) && (struct.hits < room.memory.config.maxwallandrampart)));
                return repairs;
            case 'container' : 
                containers = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_CONTAINER));
                return containers;
            case 'storage' :
                var storage = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_CONTAINER ||
                    struct.structureType == STRUCTURE_STORAGE ||
                    struct.structureType == STRUCTURE_LINK));
                return storage;
            case 'energy' :
                var energy = _.filter(roomstructures[roomName], (struct) => ((struct.structureType == STRUCTURE_CONTAINER ||
                    struct.structureType == STRUCTURE_STORAGE ||
                    struct.structureType == STRUCTURE_LINK) && 
                    ((struct.structureType == STRUCTURE_LINK) ? (struct.energy > 0):(struct.store[RESOURCE_ENERGY] > 0))));
                return energy;
            case 'refill' :
                var refills = _.filter(roomstructures[roomName], (struct) => ((struct.structureType == STRUCTURE_SPAWN || 
                    struct.structureType == STRUCTURE_EXTENSION) && (struct.energy < struct.energyCapacity)));
                return refills;
            case 'controller' :
                var control = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_CONTROLLER));
                return control;
            case 'tower':
                var tower = _.filter(roomstructures[roomName], (struct) => (struct.structureType == STRUCTURE_TOWER));
                return tower;
        }
        
    },
    
    assignHarvester: function(roomName, creep){
        
        room = Game.rooms[roomName];
        if (!creep.memory.assigned){
            for (i=0; i<room.memory.sources.length; i++) {
                for (j=0; j<room.memory.config.harvesterpersource; j++) {
                    check = room.memory.sources[i].harvester[j];
                    if (!check){
                        task = room.memory.sources[i].id;
                        room.memory.sources[i].harvester[j] = creep.id;
                        return task;
                        
                    }
                }
            }
        }
        if (creep.memory.assigned){
            tasklist = this.getStructures(room.name, 'link')
            if (tasklist.length > 0){
                linkcheck = creep.pos.findClosestByRange(tasklist);
                if (creep.pos.getRangeTo(linkcheck) < 2){
                    creep.memory.linkpresent = true;
                    creep.memory.link = linkcheck.id;
                }
            }
            tasklist = this.getStructures(room.name, 'container');
            task = creep.pos.findClosestByRange(tasklist);
        }
        if (task) {return task.id;}
        else {return 0}
    },
    
    assignBuilder: function(roomName, creep) {
        
        //Get the room object
        room = Game.rooms[roomName]
        //Are we carrying energy?
        if (creep.memory.building){
            //Find something to build...
            tasklist = this.getConstructions(room.name);
            //...that someone else isn't already.
            if (tasklist) {
                for (name in room.memory.creeps){
                    creepcheck = Game.creeps[name];
                    for (i=(tasklist.length - 1); i>=0; i--){
                        if ((tasklist[i].structureType != STRUCTURE_TOWER) && (creepcheck.memory.task == tasklist[i].id) && (creepcheck.memory.role == 'builder')) {
                            tasklist.splice(i, 1);
                        }
                    }
                }
            }
        }
        //If we're not carrying energy, we need energy.
        if (!creep.memory.building){
            //Find containers with energy.
            tasklist = this.getStructures(room.name, 'energy');
            tasklist = _.filter(tasklist, (struct) => (((struct.structureType == STRUCTURE_LINK) ? (struct.energy >= creep.carryCapacity):
                                                                                                    (struct.store[RESOURCE_ENERGY] >= creep.carryCapacity))))
            //Is there a surplus of energy?
            if (tasklist.length > 0){
                roomEnergy = _.sum(tasklist, (contain) => ((contain.structureType == STRUCTURE_LINK) ? (contain.energy):(contain.store[RESOURCE_ENERGY])));
                //No surplus, no task.
                if (roomEnergy < room.memory.config.reserve){
                    tasklist = null;
                }
            }
        }
        //Find the closest task
        task = creep.pos.findClosestByRange(tasklist);
        //Are there any tasks in the next room over? Only with building flag true...
        if (!task){
            if (tasklist && creep.memory.building){
                task = tasklist[0]
            }
        }
        //Return the task or 0
        if (task){return task.id;}
        else {return 0;}
    
    },
    
    assignRepairer: function(roomName, creep) {

        //Get the room and the creep's current position
        let room = Game.rooms[roomName]
        let mypos = creep.pos;
        //Is the creep carrying energy?
        if (creep.memory.repairing) {
            //Find something to repair
            tasklist = this.getStructures(room.name, 'repair');
            if (tasklist){
                //Sort the list to find the closest structures with the fewest hits.
                tasklist = _.sortBy(tasklist, function(struct) {return (struct.pos.getRangeTo(mypos))});
                tasklist = _.sortBy(tasklist, function(struct) {return (struct.hits)});
                //Remove any other creeps' repair tasks.
                for (let name in room.memory.creeps){
                    let creepcheck = Game.creeps[name];
                    for (i=(tasklist.length - 1); i>=0; i--){
                        if ((creepcheck.memory.task == tasklist[i].id) && (creepcheck.memory.role == 'repairer')) {
                            tasklist.splice(i, 1);
                        }
                    }
                }
                //Get the first task remaining on the list
                task = tasklist[0]
            }
        }
        //If we're not carrying energy, we need some.
        if (!creep.memory.repairing){
            tasklist = this.getStructures(room.name, 'energy');
            tasklist = _.filter(tasklist, (struct) => ((struct.structureType == STRUCTURE_LINK) ? (struct.energyCapacity >= creep.carryCapacity):
                                                                                                 (struct.store[RESOURCE_ENERGY] >= creep.carryCapacity)))
            task = creep.pos.findClosestByRange(tasklist);
        }
        //Return the task or 0
        if (task){return task.id;}
        else {return 0;}   
        
    },
    
    assignUpgrader: function(roomName, creep) {
        
        //Get the room object
        room = Game.rooms[roomName];
        //Are we carrying energy?
        if (creep.memory.upgrading){
            //Then we need to upgrade the controller.
            tasklist = this.getStructures(roomName, 'controller');
            
        }
        //If not, we need to get some energy.
        if (!creep.memory.upgrading){
            //Find a container with more energy than we can carry
            tasklist = this.getStructures(roomName, 'energy');
            tasklist = _.filter(tasklist, (struct) => (struct.structureType != STRUCTURE_LINK))
            tasklist = _.filter(tasklist, (struct) => (struct.store[RESOURCE_ENERGY] >= creep.carryCapacity));
        }
        //Get the closest task...
        task = creep.pos.findClosestByRange(tasklist);
        
        //...and return it if there is one...
        if (task){return task.id;}
        //...or return 0 if there isn't.
        else {return 0;}
        
        
    },
    
    assignDistributor: function (roomName, creep) {
        
        //Get the room object
        var room = Game.rooms[roomName];
        
        //is the creep carrying energy?
        if (creep.memory.distributing){
            //Find a place to deposit the energy
            refill = this.getStructures(room.name, 'refill');
            //Is there anything to refill?
            if ((refill.length > 0)) {
                //Is anyone else going to deposit energy there?
                for (var name in room.memory.creeps){
                    var creepcheck = Game.creeps[name];
                    for (i=(refill.length - 1); i>=0; i--){
                        if ((creepcheck.memory.task == refill[i].id) && ((creepcheck.memory.role == 'distributor') ||
                                                                         (creepcheck.memory.role == 'smalldistributor') ||
                                                                         (creepcheck.memory.role == 'towerdistributor'))) {
                            //remove the entry from the list
                            refill.splice(i, 1);
                        }
                    }
                }
                //Is there still anything to refill?
                if ((refill.length > 0) && !(creep.memory.role == 'towerdistributor')){
                    //Find the closest one
                    task = creep.pos.findClosestByRange(refill);
                }
            }
            //If there's nothing to refill, check the tower.
            if ((refill.length == 0) || (creep.memory.role == 'towerdistributor')) {
                tower = this.getStructures(room.name, 'tower');
                //If it's full, filter it out of the list.
                tower = _.filter(tower, (struct) => (struct.energy < struct.energyCapacity));
                //get the one with the lowest energy
                tower = _.sortBy(tower, (struct) => (struct.energy))
                task = tower[0];
            }
            //If this is a tower filler, check again after for refill tasks
            if ((refill.length > 0) && (creep.memory.role == 'towerdistributor') && (!task)){
                task = creep.pos.findClosestByRange(refill);
            }
        }
        //If we're not carrying energy, we need to get some.
        if (!creep.memory.distributing){
            tasklist = this.getStructures(room.name, 'energy');
            storage = room.storage
            tasklist = _.filter(tasklist, (struct) => (struct.structureType == STRUCTURE_LINK ? (((Game.getObjectById(struct.id)).pos.getRangeTo(storage) == 1) &&
                                                                                                (struct.energy >= creep.carryCapacity)) :
                                                                                                (struct.store[RESOURCE_ENERGY] >= creep.carryCapacity)));
            if (tasklist.length > 0){
                task = creep.pos.findClosestByRange(tasklist);
                if (task.structureType == STRUCTURE_STORAGE){
                    link = this.getStructures(room.name, 'storagereceivelink')
                    if (link){
                        if (link.energy > creep.carryCapacity){
                            task = link
                        }
                    }
                }
            }
            else {
                task = 0
            }
        }
        //If we have a task, return it.
        if (task){return task.id;}
        //If not, return 0.
        else {return 0;}
        
    },
    
    assignCarrier: function(roomName, creep) {
        
        //Get the room object
        room = Game.rooms[roomName];
        
        //Get and sort the list of containers by least room to most room. Only half the Storage is used.
        container = this.getStructures(room.name, 'storage');
        container = _.sortBy(container, function(struct) {
            if (container.structureType == STRUCTURE_STORAGE) {
                return ((struct.storeCapacity*0.5) - struct.store[RESOURCE_ENERGY]) 
            }
            else {
                return ((struct.structureType == STRUCTURE_LINK) ? (struct.energyCapacity - struct.energy):
                                                                    (struct.storeCapacity - struct.store[RESOURCE_ENERGY]))
            }
        });
        //Is the creep carrying energy?
        if (!creep.memory.carrying){
            //Is there stuff on the ground?
            let dropped = this.getDropped(room.name);
            if (dropped.length > 0){
                //Hey, there's stuff on the ground!
                //Let's first filter out the small stuff,
                dropped = _.sortBy(dropped, (drop) => (drop.amount));
                for (let i=(dropped.length-1); i>=0; i--){
                    if (dropped[i].amount < (creep.carryCapacity * 0.8)){
                        dropped.splice(i, 1);
                    }
                }
                //And then eliminate the stuff others are already picking up, if there's anything left...
                if (dropped.length > 0){
                    for (creepName in room.memory.creeps){
                        creepcheck = Game.creeps[creepName];
                        for (let i=(dropped.length-1); i>=0; i--){
                            if ((creepcheck.memory.task == dropped[i].id) && (creepcheck.memory.role == 'carrier')){
                                dropped.splice(i, 1)
                            }
                        }
                    }
                }
                //Is there still anything for me to pick up?
                if (dropped.length > 0){
                    //Grab the biggest one!
                    task = dropped[(dropped.length - 1)];
                    return task.id
                }
            }
            
            //We don't want to get into a loop of picking up and dropping, so...
            /*check1 = container[0];
            check2 = container[container.length - 1]
            check1room = (check1.structureType == STRUCTURE_STORAGE ? ((check1.storeCapacity*0.5) - check1.store[RESOURCE_ENERGY]):
                                                                          (check1.storeCapacity - check1.store[RESOURCE_ENERGY]));
            check2room = (check2.structureType == STRUCTURE_STORAGE ? ((check2.storeCapacity*0.5) - check2.store[RESOURCE_ENERGY]):
                                                                          (check2.storeCapacity - check2.store[RESOURCE_ENERGY]));
            if ((check1room + creep.carryCapacity) > check2room){
                task = 0
            }
            else{task = container[0];}*/
            
            //Energy reservation system ahoy!
            //Links should not be valid pickup targets.
            container = _.filter(container, (struct) => (struct.structureType != STRUCTURE_LINK))
            for (let i=0; i<container.length; i++){
                for (let id in room.memory.containers){
                    if (container[i].id == id){
                        let check = container[i]
                        
                        reserve = room.memory.containers[id].reserved
                        checkroom = ((check.structureType == STRUCTURE_STORAGE) ? ((check.storeCapacity*0.5) - check.store[RESOURCE_ENERGY]):
                                                                                 (check.storeCapacity - check.store[RESOURCE_ENERGY]));
                        checkCapacity = ((check.structureType == STRUCTURE_STORAGE) ? (check.storeCapacity*0.5):(check.storeCapacity))
                        if ((checkroom + reserve + (creep.carryCapacity * room.memory.config.carrierOffset)) < checkCapacity){
                            //We don't want to get into a loop of picking up and dropping on the same container, so...
                            check1 = container[i];
                            check2 = container[container.length - 1]
                            check1room = (check1.structureType == STRUCTURE_STORAGE ? ((check1.storeCapacity*0.5) - check1.store[RESOURCE_ENERGY]):
                                                                                       (check1.storeCapacity - check1.store[RESOURCE_ENERGY]));
                            check2room = (check2.structureType == STRUCTURE_STORAGE ? ((check2.storeCapacity*0.5) - check2.store[RESOURCE_ENERGY]):
                                                                                       (check2.storeCapacity - check2.store[RESOURCE_ENERGY]));
                            if ((check1room + creep.carryCapacity) < check2room){
                                room.memory.containers[id].reserved += creep.carryCapacity;
                                return container[i].id;
                            }
                        }
                    }
                }
            }
        }
        //Ok, the creep is carrying energy.
        if (creep.memory.carrying){
            //Do -any- containers have room?
            //Filter out the links next to the storage
            let storageobj = room.storage
            if (storageobj){
                container = _.filter(container, (struct) => (!((struct.structureType == STRUCTURE_LINK) && (storageobj.pos.getRangeTo(Game.structures[struct.id]) < 3))));
            }
            //Filter out also any links that have energy in them or have an active cooldown
            container = _.filter(container, (struct) => (!((struct.structureType == STRUCTURE_LINK) && (struct.energy > 0) && (struct.cooldown > 0))))
            let check = container[container.length - 1];
            //This bit is way too complicated.
            checkroom = ((check.structureType == STRUCTURE_STORAGE) ? ((check.storeCapacity*0.5) - check.store[RESOURCE_ENERGY]):
                        ((check.structureType == STRUCTURE_LINK) ?     (check.energyCapacity - check.energy):
                                                                       (check.storeCapacity - check.store[RESOURCE_ENERGY])));
            if (checkroom < creep.carryCapacity) {task = 0}
            else {task = check;}

        }
        //This may be a sanity check. Return the task if it exists.
        if (task){return task.id;}
        else {return 0;}
    },
}

module.exports = taskManager;