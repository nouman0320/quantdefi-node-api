ObjectId = require('mongodb').ObjectId; 



module.exports = function(app, db){

    async function getItemById(id){
        var toFind = id;
        const quantdefi = db.db('quantdefi');
        const cursor = await quantdefi.collection("items").find(toFind);
        var item=null;
        //console.log(toFind);
        await cursor.forEach(
            async function(_item){
                item = _item;
            }
        );
        
        //console.log(item);
        return item;
    }

    async function getDrectoryById(id){
        var toFind = id;
        const quantdefi = db.db('quantdefi');
        const cursor = await quantdefi.collection("folders").find(toFind);
        var directory=null;
        await cursor.forEach(
            async function(folder){
                ////console.log('---------------------------');
                ////console.log(folder);
                directory = folder;
            }
        );
        
        return directory;
    }

    async function getFileSystemFromDB(type, locality, created_by, parent, id){

        var toFind = {
            type: type,
            locality: locality
        };
        if(created_by == null)
            toFind["created_by"] = null;
        else 
            toFind["created_by"] = ObjectId(created_by);

        if(parent == null)
            toFind["parent"] = null;
        else toFind["parent"] = ObjectId(parent);

        if(id!=null){
            toFind["_id"] = ObjectId(id);
        }
            
        

        ////console.log(toFind);
        const quantdefi = db.db('quantdefi');
        const cursor = await quantdefi.collection("folders").find(toFind);

        var jsonResponse = [];
        while(await cursor.hasNext()) {
                const res = await cursor.next();
                ////console.log(res);
                var current_folder = res;
                
                var c_folders = [];
                //var c_items = [];
                
            

                if(current_folder["child_folder"] != null){
                   
                    for(var ids in current_folder["child_folder"]){
                        try{
                            var folder_id = current_folder["child_folder"][ids];
                            ////console.log(folder_id);
                            var folder_data = await getDrectoryById(ObjectId(folder_id));
                            ////console.log(folder_data);
                            var inner_data = await getFileSystemFromDB(folder_data["type"], folder_data["locality"], folder_data["created_by"], folder_data["parent"], folder_data["_id"]);
                            ////console.log(inner_data);
                            ////console.log('++++++++++++++++++')
                            c_folders.push(inner_data[0]);
                        }
                        catch(e){

                        }
                        
                    }
                }


                if(current_folder["child_item"] != null){
                   
                    for(var ids in current_folder["child_item"]){
                        try{
                            var item_id = current_folder["child_item"][ids];
                            ////console.log(folder_id);
                            var item_data = await getItemById(ObjectId(item_id));
                            //console.log(item_data);  
                            if(item_data != null){
                                c_folders.push(item_data);
                            } 
                        }
                        catch(e){

                        }   
                    }
                }

                
                
                ////console.log(c_folders);
                current_folder["child_folder"] = c_folders;
                //current_folder["child_item"] = c_items;
                ////console.log(current_folder);
                jsonResponse.push(current_folder);
        }
            

        ////console.log("+++++++++++++++++++++++==")
        ////console.log(jsonResponse);
        return jsonResponse;
    }



    app.post('/getgroup', async (req, res) =>{
        var id = ObjectId(req.body._id);
        var group = {};
        const quantdefi = db.db('quantdefi');
        var cursor = await quantdefi.collection("group-items").find({_id:id});
        while(await cursor.hasNext()) {
            group = await cursor.next();
        }

        res.send(group);
    });



    app.post('/openassembly', async (req, res) =>{
        var id = ObjectId(req.body._id);
        var assembly = {};
        const quantdefi = db.db('quantdefi');
        var cursor = await quantdefi.collection("items").find({_id:id});
        while(await cursor.hasNext()) {
            assembly = await cursor.next();
        }

        res.send(assembly);
    });

    app.post('/openitem', async (req, res) =>{
        var id = ObjectId(req.body._id);
        var item = {};
        const quantdefi = db.db('quantdefi');
        var cursor = await quantdefi.collection("items").find({_id:id});
        while(await cursor.hasNext()) {
            item = await cursor.next();
        }

        res.send(item);
    });



    app.post('/deleteitemgroup', async (req, res) =>{
        var group_id = ObjectId(req.body._group_id);
        var assembly_id = ObjectId(req.body._assembly_id);
        var group_index = req.body.item_index;

        const quantdefi = db.db('quantdefi');

        var cursor = await quantdefi.collection("items").find({_id: assembly_id});
        while(await cursor.hasNext()) {
            const assembly = await cursor.next();

            if(assembly["group_item"]==null){
            } else {
                
                var tempArr = [];
                var deleted = false;
                for(let i=0; i<assembly["group_item"].length;i++){
                    if(assembly["group_item"][i] != req.body._group_id && !deleted){
                        tempArr.push(assembly["group_item"][i]);
                    }
                    else if(deleted){
                        tempArr.push(assembly["group_item"][i]);
                    }
                    else{
                        deleted = true;
                    }
                }
                
                console.log(tempArr);

                await quantdefi.collection("group-items").updateOne({_id: assembly_id},{ $set: {group_item: tempArr}},{ "upsert" : true });
            }
        
        }

        await quantdefi.collection("group-items").deleteOne({_id:group_id});

        res.send({});
        
    });


    app.post('/deleteiteminsidegroup', async (req, res) =>{
        var group_id = ObjectId(req.body._group_id);
        var item_id = ObjectId(req.body._item_id);
        var item_index = req.body.item_index;

        const quantdefi = db.db('quantdefi');

        var cursor = await quantdefi.collection("group-items").find({_id: group_id});
        while(await cursor.hasNext()) {
            const group = await cursor.next();

            if(group["group_items"]==null){
            } else {
                
                var tempArr = [];
                var deleted = false;
                for(let i=0; i<group["group_items"].length;i++){
                    if(group["group_items"][i] != req.body._item_id && !deleted){
                        tempArr.push(group["group_items"][i]);
                    }
                    else if(deleted){
                        tempArr.push(group["group_items"][i]);
                    }
                    else{
                        deleted = true;
                    }
                }
                
                console.log(tempArr);

                await quantdefi.collection("group-items").updateOne({_id: group_id},{ $set: {group_items: tempArr}},{ "upsert" : true });
            }
        
        }

        res.send({});
        
    });



    app.post('/createitemgroup', async (req, res) =>{

        var id = ObjectId(null);
        var name = req.body.name;
        var created_by = ObjectId(req.body.created_by);
        var assembly_id = ObjectId(req.body.assembly_id);

        const quantdefi = db.db('quantdefi');

        var toInsert = {
            "_id": id,
            "name": name,
            "created_by": created_by,
            "group_items":[]
        }

        await quantdefi.collection("group-items").insertOne(toInsert);

        var cursor = await quantdefi.collection("items").find({_id: assembly_id});
        while(await cursor.hasNext()) {
            const assembly = await cursor.next();

            if(assembly["group_item"]==null){
                await quantdefi.collection("items").updateOne({_id: assembly_id},{ $set: {group_item: [id]}},{ "upsert" : true });
            } else {
                assembly["group_item"].push(id);
                await quantdefi.collection("items").updateOne({_id: assembly_id},{ $set: {group_item: assembly["group_item"]}},{ "upsert" : true });
            }
        
        }


        res.send({_id:id});
    });

    app.post('/removerequireditem', async (req, res) =>{
        var id = ObjectId(req.body._id);
        var parent_id = ObjectId(req.body._parent_id);
        var index = req.body.index

        const quantdefi = db.db('quantdefi');

        cursor = await quantdefi.collection("items").find({_id: parent_id});
        while(await cursor.hasNext()) {
            const assembly = await cursor.next();

            if(assembly["required_item"]==null){
            } else {

                var new_r_i = [];
                for(let i=0;i<assembly["required_item"].length;i++){
                    if(i!=index){
                        new_r_i.push(assembly["required_item"][i]);
                        console.log(i);
                        console.log(index);
                    }
                }

                //console.log(assembly);
                await quantdefi.collection("items").updateOne({_id: parent_id},{ $set: {required_item: new_r_i}},{ "upsert" : true });
            }
        
        }

        res.send({});

    });



    app.post('/getrequireditemforgroup', async (req, res) =>{
        var id = ObjectId(req.body._id);
        var group_id = ObjectId(req.body._group_id);
        var item = {};
        const quantdefi = db.db('quantdefi');
        var cursor = await quantdefi.collection("items").find({_id:id});
        while(await cursor.hasNext()) {
            item = await cursor.next();
        }

        cursor = await quantdefi.collection("group-items").find({_id: group_id});
        while(await cursor.hasNext()) {
            const group = await cursor.next();

            if(group["group_items"]==null){
                await quantdefi.collection("group-items").updateOne({_id: group_id},{ $set: {group_items: [id]}},{ "upsert" : true });
            } else {
                group["group_items"].push(id);
                await quantdefi.collection("group-items").updateOne({_id: group_id},{ $set: {group_items: group["group_items"]}},{ "upsert" : true });
            }
        
        }

        res.send(item);
    });



    app.post('/getrequireditem', async (req, res) =>{
        var id = ObjectId(req.body._id);
        var parent_id = ObjectId(req.body._parent_id);
        var item = {};
        const quantdefi = db.db('quantdefi');
        var cursor = await quantdefi.collection("items").find({_id:id});
        while(await cursor.hasNext()) {
            item = await cursor.next();
        }

        cursor = await quantdefi.collection("items").find({_id: parent_id});
        while(await cursor.hasNext()) {
            const assembly = await cursor.next();

            if(assembly["required_item"]==null){
                await quantdefi.collection("items").updateOne({_id: parent_id},{ $set: {required_item: [id]}},{ "upsert" : true });
            } else {
                assembly["required_item"].push(id);
                await quantdefi.collection("items").updateOne({_id: parent_id},{ $set: {required_item: assembly["required_item"]}},{ "upsert" : true });
            }
        
        }

        res.send(item);
    });

    app.post('/newitem', async (req, res) =>{


        /*
const jsonObj = {
      "locality": this.item.locality,
      "name": this.item.name,
      "parent": this.item.parent,
      "created_by": this.item.created_by,
      "purchase_unit": this.item.purchase_unit,
      "item_unit": this.item.item_unit,
      "coverage_rate_1": this.item.coverage_rate_1,
      "coverage_rate_2": this.item.coverage_rate_2,
      "cost_type": this.item.cost_type,
      "unit_cost": this.item.unit_cost,
      "accounting_code": this.item.accounting_code
    }
        */

        var locality = req.body.locality;
        var name = req.body.name;
        var parent = ObjectId(req.body.parent);
        var created_by = req.body.created_by;
        if(created_by!=null){
            created_by = ObjectId(created_by);
        }
        var purchase_unit = req.body.purchase_unit;
        var item_unit = req.body.item_unit;
        var coverage_rate_1 = req.body.coverage_rate_1;
        var coverage_rate_2 = req.body.coverage_rate_2;
        var cost_type = req.body.cost_type;
        var unit_cost = req.body.unit_cost;
        var accounting_code = req.body.accounting_code;

        const new_id = ObjectId(null);

        var toInsert = {
            "_id":new_id,
            "locality": locality,
            "name": name,
            "parent": parent,
            "created_by": created_by,
            "purchase_unit": purchase_unit,
            "item_unit": item_unit,
            "coverage_rate_1": coverage_rate_1,
            "coverage_rate_2": coverage_rate_2,
            "cost_type": cost_type,
            "unit_cost": unit_cost,
            "accounting_code": accounting_code
        }


        const quantdefi = db.db('quantdefi');
        await quantdefi.collection("items").insertOne(toInsert);

        const cursor = await quantdefi.collection("folders").find({_id: parent});

        while(await cursor.hasNext()) {
            const folder = await cursor.next();
            //console.log("====");
            //console.log(folder);
            if(folder["child_item"]==null){
                //console.log("null");
                await quantdefi.collection("folders").updateOne({_id: parent},{ $set: {child_item: [new_id]}},{ "upsert" : true });
            } else {
                //console.log("not null");
                folder["child_item"].push(new_id);
                await quantdefi.collection("folders").updateOne({_id: parent},{ $set: {child_item: folder["child_item"]}},{ "upsert" : true });
            }
        
        }

        res.status(201).send({_id:new_id});
    });


    app.post('/saveitem', async (req, res) =>{

        const quantdefi = db.db('quantdefi');

        var saveAs = req.body._save_as;
        var userId = req.body._user_id;

        var new_id = ObjectId(req.body._id);

        


        var locality = req.body.locality;
        var name = req.body.name;
        var parent = ObjectId(req.body.parent);
        var created_by = req.body.created_by;
        if(created_by!=null){
            created_by = ObjectId(created_by);
        }

        if(saveAs){
            new_id = ObjectId(null);
            created_by = ObjectId(userId);

            var cur = await quantdefi.collection("folders").find({save_as: true, locality: 'item', created_by: ObjectId(userId)});

            var hasN = await cur.hasNext();
            if(hasN){
                while(await cur.hasNext()) {
                    const folder = await cur.next();
                    folder["child_item"].push(new_id);
                    await quantdefi.collection("folders").updateOne({_id: folder['_id']},{ $set: {child_item: folder["child_item"]}},{ "upsert" : true });
                }
            } else {
                const new_id_ = ObjectId(null);

                var data = {
                    "_id": new_id_,
                    "type": 'custom',
                    "save_as": true,
                    "locality": 'item',
                    "name": 'My Custom Saves',
                    "child_folder": null,
                    "child_item": [new_id],
                    "parent": null,
                    "created_by": ObjectId(userId),
                    "creation_date": new Date()
                }

                await quantdefi.collection("folders").insertOne(data);
            }
            



        }

        var purchase_unit = req.body.purchase_unit;
        var item_unit = req.body.item_unit;
        var coverage_rate_1 = req.body.coverage_rate_1;
        var coverage_rate_2 = req.body.coverage_rate_2;
        var cost_type = req.body.cost_type;
        var unit_cost = req.body.unit_cost;
        var accounting_code = req.body.accounting_code;


        var toInsert = {
            "_id":new_id,
            "locality": locality,
            "name": name,
            "parent": parent,
            "created_by": created_by,
            "purchase_unit": purchase_unit,
            "item_unit": item_unit,
            "coverage_rate_1": coverage_rate_1,
            "coverage_rate_2": coverage_rate_2,
            "cost_type": cost_type,
            "unit_cost": unit_cost,
            "accounting_code": accounting_code
        }

        await quantdefi.collection("items").deleteOne({_id:new_id});
        await quantdefi.collection("items").insertOne(toInsert);

        res.status(201).send({_id:new_id});
    });


    app.post('/newassembly', async (req, res) =>{



        var locality = req.body.locality;
        var id_f = req.body.id_f;
        var name = req.body.name;
        var parent = ObjectId(req.body.parent);
        var created_by = req.body.created_by;
        if(created_by!=null){
            created_by = ObjectId(created_by);
        }
        var unit = req.body.units;
        var description = req.body.description;

        const new_id = ObjectId(null);

        var toInsert = {
            "_id":new_id,
            "locality": locality,
            "id_f": id_f,
            "name": name,
            "parent": parent,
            "created_by": created_by,
            "unit": unit,
            "description": description
        }


        const quantdefi = db.db('quantdefi');
        await quantdefi.collection("items").insertOne(toInsert);

        const cursor = await quantdefi.collection("folders").find({_id: parent});

        while(await cursor.hasNext()) {
            const folder = await cursor.next();
            //console.log("====");
            //console.log(folder);
            if(folder["child_item"]==null){
                //console.log("null");
                await quantdefi.collection("folders").updateOne({_id: parent},{ $set: {child_item: [new_id]}},{ "upsert" : true });
            } else {
                //console.log("not null");
                folder["child_item"].push(new_id);
                await quantdefi.collection("folders").updateOne({_id: parent},{ $set: {child_item: folder["child_item"]}},{ "upsert" : true });
            }
        
        }

        res.status(201).send({_id:new_id});
    });



    app.post('/saveassembly', async (req, res) =>{

        const quantdefi = db.db('quantdefi');

        var saveAs = req.body._save_as;
        var userId = req.body._user_id;

        var new_id = ObjectId(req.body._id);


        var locality = req.body.locality;
        var id_f = req.body.id_f;
        var name = req.body.name;
        var parent = ObjectId(req.body.parent);
        var created_by = req.body.created_by;
        if(created_by!=null){
            created_by = ObjectId(created_by);
        }

        var group_item = [];


        if(saveAs){
            var gcur = await quantdefi.collection("items").find({_id:new_id});
            while(await gcur.hasNext()){
                var assembly = await gcur.next();
                group_item = assembly['group_item'];
            }

            var new_group_item = [];

            for(let i=0;i<group_item.length;i++){
                var gcur2 = await quantdefi.collection('group-items').find({_id:ObjectId(group_item[i])});
                while(await gcur2.hasNext()){
                    var group = await gcur2.next();

                    var new_group_id = ObjectId(null);
                    group['_id'] = new_group_id;
                    new_group_item.push(new_group_id);

                    await quantdefi.collection('group-items').insertOne(group);
                }
            }

            group_item = new_group_item;

        }




        if(saveAs){
            new_id = ObjectId(null);
            created_by = ObjectId(userId);

            var cur = await quantdefi.collection("folders").find({save_as: true,locality: 'assembly', created_by: ObjectId(userId)});

            var hasN = await cur.hasNext();
            if(hasN){
                while(await cur.hasNext()) {
                    const folder = await cur.next();
                    folder["child_item"].push(new_id);
                    await quantdefi.collection("folders").updateOne({_id: folder['_id']},{ $set: {child_item: folder["child_item"]}},{ "upsert" : true });
                }
            } else {
                const new_id_ = ObjectId(null);

                var data = {
                    "_id": new_id_,
                    "type": 'custom',
                    "save_as": true,
                    "locality": 'assembly',
                    "name": 'My Custom Saves',
                    "child_folder": null,
                    "child_item": [new_id],
                    "parent": null,
                    "created_by": ObjectId(userId),
                    "creation_date": new Date()
                }

                await quantdefi.collection("folders").insertOne(data);
            }
        }



        var unit = req.body.units;
        var description = req.body.description;

        var toInsert = {
            "_id":new_id,
            "locality": locality,
            "id_f": id_f,
            "name": name,
            "parent": parent,
            "created_by": created_by,
            "unit": unit,
            "description": description,
            "group_item": group_item
        }


        //const quantdefi = db.db('quantdefi');
        await quantdefi.collection("items").deleteOne({_id:new_id});
        await quantdefi.collection("items").insertOne(toInsert);

        res.status(201).send({_id:new_id});
    });

    app.post('/filesystem', async (req, res) =>{

        var type = req.body.type;
        var locality = req.body.locality;
        var created_by;

        if(req.body.created_by == null){
            created_by = null;
        }
        else {
            created_by = ObjectId(req.body.created_by);
        }
        

        ////console.log(type)

        if(type=='default' && locality=='assembly'){
            res.send(await getFileSystemFromDB(type, locality, created_by, null, null));
        } else if(type=='custom' && locality=='assembly'){
            res.send(await getFileSystemFromDB(type, locality, created_by, null, null));
        }
        else if(type=='default' && locality=='item'){
            res.send(await getFileSystemFromDB(type, locality, created_by, null, null));
        } else if(type=='custom' && locality=='item'){
            res.send(await getFileSystemFromDB(type, locality, created_by, null, null));
        }
    });

    app.post('/newfolder', async (req, res) =>{

        var type = req.body.type;
        var locality = req.body.locality;
        var name = req.body.name;
        var child_folder = null;
        var child_item = null;
        var parent = null;
        if(req.body.parent != null){ 
            parent = ObjectId(req.body.parent);
        }

        var created_by;
        if(req.body.created_by == null){
            created_by = null;
        }
        else{
            created_by = ObjectId(req.body.created_by);
        }

        var creation_date = new Date();

        const quantdefi = db.db('quantdefi');

        const new_id = ObjectId(null);

        var data = {
            "_id": new_id,
            "type": type,
            "locality": locality,
            "name": name,
            "child_folder": child_folder,
            "child_item": child_item,
            "parent": parent,
            "created_by": created_by,
            "creation_date": creation_date
        }

        quantdefi.collection("folders").insertOne(data);

        if(parent!=null){


            var toFind = {
                _id: parent
            }

            const cursor = await quantdefi.collection("folders").find(toFind);

            while(await cursor.hasNext()) {
                const folder = await cursor.next();
                //console.log("====");
                //console.log(folder);
                if(folder["child_folder"]==null){
                    //console.log("null");
                    await quantdefi.collection("folders").updateOne({_id: parent},{ $set: {child_folder: [new_id]}},{ "upsert" : true });
                } else {
                    //console.log("not null");
                    folder["child_folder"].push(new_id);
                    await quantdefi.collection("folders").updateOne({_id: parent},{ $set: {child_folder: folder["child_folder"]}},{ "upsert" : true });
                }
            
            }

        }


        res.status(201).send({});
    });


    async function delete_filesystem(id, type){

        const quantdefi = db.db('quantdefi');
        if(type == "folder")
        {
            const cursor = await quantdefi.collection("folders").find({_id:ObjectId(id)});

            while(await cursor.hasNext()) {
                const folder = await cursor.next();
                
                if(folder["child_folder"]!=null){
                    for(i in folder["child_folder"]){
                        const id_c = folder["child_folder"][i];
                        await delete_filesystem(id_c, "folder");
                    }
                }


                if(folder["child_item"]!=null){
                    for(i in folder["child_item"]){
                        const id_c = folder["child_item"][i];
                        await delete_filesystem(id_c, "item");
                    }
                }
                
                await quantdefi.collection("folders").deleteOne({_id:ObjectId(id)});
                
            }
        }
        else if(type == "item"){
            await quantdefi.collection("items").deleteOne({_id:ObjectId(id)});
        }
    }

    app.post('/delete-filesystem', async (req, res) =>{

        var id = req.body._id;
        var type = req.body.type;

        if(type == "item"){
            await delete_filesystem(id, type);
        } 
        else if(type == "folder"){
            await delete_filesystem(id, type);
        }
        else{
            res.status(400).send({});
        }


        res.status(202).send({});
    });

    app.post('/folder', (req, res) => {
        //console.log('Request body', req.body);
        var promises = [];
        var folder_id = req.body.folder_id;

        var response = {};
        if(folder_id!= null || folder_id!=undefined){
            
                //var toFind = {_id:ObjectId(folder_id)}
                var toFind = ObjectId(folder_id);
                //console.log(toFind)
                const quantdefi = db.db('quantdefi')
                
                promises.push(new Promise ((resolve, reject) => {
                    try{
                        //console.log("call");
                        const cursor = quantdefi.collection("folders").find(toFind);
                        cursor.forEach(
                            function (res) {
                                var folder_response = res;
                                //console.log(folder_response);
                                response = folder_response;
                                resolve();
                            }
                        );
                    } catch(error){
                        reject(error);
                    }
                }));
            
        }
        Promise.all(promises).then(function(values) {
            res.send(response);
        }).catch(function(error) {
            // Something went wrong. Let the error middleware deal with the problem.
            //console.log(error);
            // Instead we can just send an error response, like so:
            res.status(500).json({error: error.toString()});
        });
    });


    
    
}

