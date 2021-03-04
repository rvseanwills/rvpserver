const Business = require("../model/Business");

exports.createBusiness = (req, res) => {

    //This function will create a business structure
    //It will need the name of the business, nothing else,
    //To auth this business, bank details will need to be entered into
    //the db, THIS IS A TODO

    try {

        //First check that the business name is included, if it is then create the business
        if ( typeof req.body.name === "undefined" ) {
            sendError(res, "There was no business name in the request")
        }

        //Create new business instance
        var new_business = new Business({
            name: req.body.name,
            team_ids: [],
            networks: [],
        })

        //Send instance to db and check for errors
        new_business.save(function (err, doc) {
            if (err) {
                console.log("error creating the business structure", err)
                sendError(res, "There was a problem saving the new business, error: ", err)
            }
            //Send the business id for the account and report creation process
            res.status(200).json({msg: "Success the business was created, here is the id ", id: doc._id})
        });

    } catch (err) {
        console.log("Problem creating the business structure, error: " + err);
        sendError(res, "Error creating the business", err)
    }

}

exports.updateBusiness = async (req, res) => {
    //This function needs to be able to update team ids and network properties dynamically, the name will never be updated
    
    try {

        //First check that there is a property identifier and the data
        //TODO make faster by checking if values are empty strings

        if (typeof req.body.identifier === "undefined" || typeof req.body.data === "undefined" || req.body.business_id === "undefined") {
            sendError(res, "there was no identifier and/or data and/or business_id in the request");
        }

        const identifier = req.body.identifier;
        const network = req.body?.network;
        const _id = req.body.business_id;
        var data = req.body.data;

        //We need to find if the business exists first
        var business = await Business.findById(_id);

        //If there is both then check what data is to be updated
        if (identifier === "team_ids"){
            //update the team ids
            //Simply push the new id to the team_ids
            business.updateOne(
                { $push: { team_ids: data } },
                (err) => {
                    if (err) {
                        console.log("Error updating the business team ids. error " + err);
                        sendError(res, "Error updating the team, error", err)
                    }
                    res.status(200).json({msg: "Success updating the team"})
                    return;
                }
            );
        } else {
            if (typeof network === "undefined") {
                console.log("The network name was not found in the request");
                sendError(res, "The social network name was not in the request")
            } else {
                //what is the network
                //access its array
                //update its values
                var networks = business.networks;
                //extract the object which has the same network name
                var network_obj = networks.some( (n, i) => {
                    if (n.name == network) {
                        return n;
                    }
                    if (i == networks.length-1) {
                        return false;
                    }
                } )
                //check if there was a match
                if (network_obj) {
                    //update objects array
                    if ( identifier === "access_tokens" ) {
                        business.networks.access_tokens.push(data);
                    }
                    if ( identifier === "reports") {
                        business.networks.reports.push(data);
                    } else {
                        sendError(res, "There was no accesstoken or report identifier");
                    }
                    //save object 
                    business.save().then((doc, err) => {
                        if (err) {
                            sendError(res, "There was a problem saving the updated business model", err)
                        }
                        //TODO, send less data
                        res.status(200).json({msg: "The business has been updated with new "+identifier, data: doc})
                    });               
                }
            }
        }

    } catch (err) {
        console.log("Problem updating the business structure, error: " + err)
        sendError(res, "Error updating the business", err)
    }
}

//HELPERS
function sendError(res, msg, err = null) {
    res.status(400).json({msg: msg, err: err})
}