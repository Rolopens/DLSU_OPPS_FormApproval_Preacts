// packages

// defined in model
const {
    Form
} = require("../models/preactsForm.js");

/*
    Accepts: Form object
    return: new promise that resolves the newly added form
    Adds a form into the database
*/
module.exports.addForm = function (form) {
    return new Promise(function (resolve, reject) {
        //Create DB form object
        //var form = new Form(form);
        
        //Save object in database and check if it resolves
        form.save().then((newForm) => {
            resolve(newForm)
        }, (err) => {
            reject(err)
        })
    })
}

/*
    Accepts: Title of Activity (STRING)
    return: new promise that resolves the form found
    Search database with title
*/
module.exports.findFormViaTitle = function (title) {
    return new Promise(function (resolve, reject) {
        
        //Search for db with the title with the substring
        Form.find({
            title: {
                $regex: title
            }
        }).then((similarForm) => {
            resolve(similarForm)
        }, (err) => {
            reject(err)
        })
    })
}

/*
    Accepts: _id (OBJECTID)
    return: new promise that resolves the form found
    Search database with certain objectID
*/
module.exports.findFormViaId = function (_id) {
    return new Promise(function (resolve, reject) {

        //Search for db with the title with the substring
        Form.find({
            _id
        }).then((similarForms) => {
            resolve(similarForms)
        }, (err) => {
            reject(err)
        })
    })
}

/*
    Accepts: Form object
    return: new promise that returns the newly updated form
    Adds a form into the database
*/
module.exports.updateForm = function (form) {
    return new Promise(function (resolve, reject) {

        //Search for db with the title with the substring
        Form.findOneAndUpdate({
            _id: form.id
        }, {
            user_id: form.user_id,
            title: form.title,
            nature: form.nature,
            typeOfActivity: form.typeOfActivity,
            date: form.date,
            enmp: form.enmp,
            enp: form.enp,
            venue: form.venue,
            context: form.context,
            objectives: form.objectives,
            state: form.state,
            comments: form.comments,
            position: form.position,
            projectHeads: form.projectHeads

        }).then((updatedForms) => {
            resolve(updatedForms)
        }, (err) => {
            reject(err)
        })
    })
}

/*
    Accepts: _id(Objectid)
    return: new promise that returns the result / deleted object
    Deletes a form into the database
*/
module.exports.deleteFormViaId = function (_id) {
    return new Promise(function (resolve, reject) {
        Form.remove({
            _id
        }).then((result) => {
            resolve(result)
        }, (err) => {
            reject(err)
        })
    })
}
