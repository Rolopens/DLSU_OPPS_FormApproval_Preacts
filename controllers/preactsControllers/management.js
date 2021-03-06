const path = require("path");
const duration = require("duration");
const fs = require('fs')

const userService = require(path.join(__dirname, "..", "..", "models", "userService.js"));
const roleService = require(path.join(__dirname, "..", "..", "models", "roleService.js"));
const orgService = require(path.join(__dirname, "..", "..", "models", "orgService.js"));
const preactsService = require(path.join(__dirname, "..", "..", "models", "preactsService.js"));
const processes = require(path.join(__dirname, "..", "..", "configuration", "approvalProcess.json"))
const {
    Form
} = require(path.join(__dirname, "..", "..", "models", "preactsForm.js"))

module.exports.controller = function (app){
     //form
    app.get('/create-form', function (req, res) {

        if (!req.session.uid) res.redirect("/");

        userService.getUserWithId(req.session.uid).then((retUser) => {
            var roleId = retUser.user_roles[0].role_id; //FIX THIS LATER ON DEPENDING ON HOW MANY ORGS THEY HAVE
            var orgId = retUser.user_roles[0].org_id;
            roleService.getRoleWithId(roleId).then((retRole) => {
                orgService.findSpecificOrg(orgId).then((orgObject) => {
                    if (retRole.name != "PROJECT_HEAD") {
                        res.redirect('/preacts');
                    } else {
                        var data = {
                            type: orgObject.type,
                            name: orgObject.name
                        }
                        res.render('form', {
                            data: data
                        });
                    }
                }).catch((err) => {
                    console.log("ERROR MESSAGE: Cannot find org with id " + orgId);
                    console.log(err);
                });
            }).catch((err) => {
                console.log("ERROR MESSAGE: Cannot find role with id " + roleId);
                console.log(err);
            });
        }).catch((err) => {
            console.log("ERROR MESSAGE: Cannot find user with id " + req.session.uid);
            console.log(err);
        });
    });

    //confirm page
    app.post('/create-form-confirm', function (req, res) {
        var isSlife = false;
        req.session.submissionValue = false;
        req.session.title = req.body.title;
        req.session.nature = req.body.nature;
        if (req.body.type.split("-")[0] == 'SLIFE') {
            isSlife = true;
            if (req.body.type.split("-")[1] == 'Others') {
                req.session.type = req.body.typeOthers2;
            } else {
                req.session.type = req.body.type.split("-")[1];
            }
        } else {
            if (req.body.type.split("-")[1] == 'Others') {
                req.session.type = req.body.typeOthers;
            } else {
                req.session.type = req.body.type.split("-")[1];
            }
        }
        req.session.startDate = req.body.startDate;
        req.session.startTime = req.body.startTime;
        req.session.endTime = req.body.endTime;
        req.session.venue = req.body.venue;
        req.session.enmp = req.body.enmp;
        req.session.enp = req.body.enp;
        req.session.reach = req.body.reach;
        if (req.body.online == 'yes') {
            req.session.online = true;
        } else {
            req.session.online = false;
        }
        if (req.body.GOSM == 'yes') {
            req.session.GOSM = true;
        } else {
            req.session.GOSM = false;
        }
        
        var startTimeTemp = req.body.startTime;
        var startTimeTempArray = startTimeTemp.split(" ");        
        req.session.startDateAlt = new Date(req.body.startDate + " " + startTimeTempArray[0] + ":00");

        req.session.context1 = req.body.context1;
        req.session.context2 = req.body.context2;
        req.session.context3 = req.body.context3;
        req.session.objective1 = req.body.objective1;
        req.session.objective2 = req.body.objective2;
        req.session.objective3 = req.body.objective3;

        //accessing data from project head table
        var pheadData = [];

        var pheadlength = parseInt(req.body.dynamicTable1len, 10) + 1;
        for (var i = 0; i < pheadlength; i++) {
            var rowdata = {
                name: req.body['phead_name' + i],
                contact_number: req.body['phead_number' + i]
            }
            pheadData.push(rowdata);
        }
        req.session.pheadData = pheadData;
        //console.log("PHEAD LENGTH: " + pheadlength)

        //accessing data from comprehensive program design table
        var programData = [];
        var programlength = parseInt(req.body.dynamicTable2len, 10) + 1;
        for (var i = 0; i < programlength; i++) {
            var start = req.body['startTime' + i].split(":");
            var end = req.body['endTime' + i].split(":");
            var dur = new duration(new Date(0, 0, 0, start[0], start[1], 0, 0), new Date(0, 0, 0, end[0], end[1], 0, 0));

            var rowdata = {
                startTime: req.body['startTime' + i],
                endTime: req.body['endTime' + i],
                duration: dur.minutes,
                activity: req.body['activity' + i],
                description: req.body['description' + i],
                person: req.body['person' + i]
            }
            programData.push(rowdata);
        }
        req.session.programData = programData;

        req.session.PR = {
            name: req.body.namePR,
            position: req.body.positionPR
        }

        req.session.PR_2 = {
            name: req.body.namePR2,
            position: req.body.positionPR2
        }

        if(req.body.expenses == 1) {
            req.session.sourceFunds = {
                organization_funds: req.body.OrganizationalFunds,
                participants_fee: req.body.ParticipantsFee,
                others: req.body.OtherFunds,
                total: parseFloat(req.body.OrganizationalFunds) + parseFloat(req.body.ParticipantsFee) + parseFloat(req.body.OtherFunds)
            }
            
            //accessing data from breakdown of expenses table
            var expensesData = [];
            var expenseslength = parseInt(req.body.dynamicTable3len, 10) + 1;
            var totalExpenses = 0.00;
            for (var i = 0; i < expenseslength; i++) {
                var rowdata = {
                    name: req.body['material' + i],
                    quantity: req.body['quantity' + i],
                    unit_cost: req.body['unit' + i],
                    total_cost: req.body['quantity' + i] * req.body['unit' + i]
                }
                totalExpenses = rowdata.total_cost + totalExpenses;
                expensesData.push(rowdata);
            }
            req.session.breakdownOfExpenses = {
                material: expensesData,
                total_expense: totalExpenses
            }
            
            //accessing data from projected expenses table
            var projExpData = [],
                totalExp = 0;
            var projExplength = parseInt(req.body.dynamicTable5len, 10) + 1;
            for (var i = 0; i < projExplength; i++) {
                var rowdata = {
                    item: req.body['it' + i],
                    quantity: req.body['qu' + i],
                    price: req.body['pr' + i],
                    amount: req.body['qu' + i] * req.body['pr' + i]
                }
                totalExp = totalExp + req.body['qu' + i] * req.body['pr' + i]
                projExpData.push(rowdata);
            }
            req.session.porjExpData = projExpData;
        } else {
            console.log("NO EXPENSES");
            req.session.sourceFunds = {
                organization_funds: null,
                participants_fee: null,
                others: null,
                total: null
            };
            req.session.breakdownOfExpenses = {
                material: null,
                total_expense: null
            };
            totalExpenses = 0;
            totalExp = 0;
            req.session.porjExpData = null;
        }

        //        req.session.boeTotal = req.body.boeTotal;
        req.session.organizational_funds = {
            operational_fund: req.body.OperationalFund,
            depository_fund: req.body.DepositoryFund,
            other_fund: req.body.OtherFund,
            //accumulated_fund: req.body.AccumulatedFund,
            total_disbursement: parseFloat(req.body.OperationalFund) + parseFloat(req.body.DepositoryFund) + parseFloat(req.body.OtherFund),
            projected_expenses: totalExpenses,
            rem_balance: parseFloat(req.body.OperationalFund) + parseFloat(req.body.DepositoryFund) + parseFloat(req.body.OtherFund) - totalExpenses
        }
        
        if(req.body.income == 1) {
            //accessing data from projected revenue table
            var projRevData = [],
                totalRev = 0.00;
            var projRevlength = parseInt(req.body.dynamicTable4len, 10) + 1;
            for (var i = 0; i < projRevlength; i++) {
                var rowdata = {
                    item: req.body['item' + i],
                    quantity: req.body['qty' + i],
                    price: req.body['price' + i],
                    amount: req.body['qty' + i] * req.body['price' + i]
                }
                totalRev = totalRev + req.body['qty' + i] * req.body['price' + i];
                projRevData.push(rowdata);
            }
            req.session.projRevData = projRevData;
            req.session.projIncomeTotal = totalRev - totalExp;
        } else {
            req.session.projRevData = null;
            req.session.projIncomeTotal = null;
            req.session.porjExpData = null;
        }

        var usersOrganization, processType;
        userService.getUserWithId(req.session.uid).then((userObject) => {
            var org_id = userObject.user_roles[0].org_id;
            orgService.findSpecificOrg(org_id).then((orgObject) => {
                usersOrganization = orgObject.name;
                var batchGovNames = ["CATCH", "BLAZE", "FAST", "ENG", "FOCUS", "EDGE", "EXCEL"]
                //if statements to see what process the form should go under - still in progress
                if (orgObject.type == 'CSO') {
                    processType = "ORGANIZATIONS_PROCESS"
                    if (isSlife) {
                        processType = processType + "-SLIFE"
                    } else {
                        processType = processType + "-CSO"
                    }
                } else {
                    processType = "GOVERNMENT_PROCESS"
                    if (orgObject.abbrev.includes(batchGovNames[0]) || orgObject.abbrev.includes(batchGovNames[1]) || orgObject.abbrev.includes(batchGovNames[2]) || orgObject.abbrev.includes(batchGovNames[3]) || orgObject.abbrev.includes(batchGovNames[4]) || orgObject.abbrev.includes(batchGovNames[5]) || orgObject.abbrev.includes(batchGovNames[6])) {
                        processType = processType + "-BATCH"
                    } else if (orgObject.abbrev.includes("CG")) {
                        processType = processType + "-COLLEGE"
                    } else {
                        processType = processType + "-USG"
                    }
                    if (isSlife) {
                        processType = processType + "-SLIFE"
                    } else {
                        processType = processType + "-DAAM"
                    }
                }
                console.log("DEBUG: PROCESS TYPE -> " + processType)
                var org, role, orgObj, roleObj;
                var str = processes[processType][0];
                //                console.log(str)

                var temp = str.split("-", 2);
                //                console.log(temp)
                org = temp[1];
                role = temp[0];
                //                console.log(org + "BEFORE THE PROMISES PLEASE HELP ME")
                if (org == 'ORG') {
                    roleService.getRoleWithName(role).then((retRole) => {
                        roleObj = retRole;
                        orgService.getOrgWithName(usersOrganization).then((retOrg) => {
                            orgObj = retOrg;
                            userService.findUserByOrgAndRoleID(orgObj._id, roleObj._id).then((retUsers) => {
                                req.session.currentCheckers = retUsers
                                roleService.getRoleWithId(userObject.user_roles[0].role_id).then((role) => {
                                    //form creation
                                    var form = new Form({
                                        "title": req.session.title,
                                        "nature": req.session.nature,
                                        "typeOfActivity": req.session.type,
                                        "enmp": req.session.enmp,
                                        "enp": req.session.enp,
                                        "startDate": req.session.startDate,
                                        "startDateAlt": req.session.startDateAlt,
                                        "startTime": req.session.startTime,
                                        "endTime": req.session.endTime,
                                        "venue": req.session.venue,
                                        "reach": req.session.reach,
                                        "GOSM": req.session.GOSM,
                                        "online": req.session.online,
                                        "context": [req.session.context1, req.session.context2, req.session.context3],
                                        "objectives": [req.session.objective1, req.session.objective2, req.session.objective3],
                                        "person_responsible": [req.session.PR, req.session.PR_2],
                                        "source_funds": req.session.sourceFunds,
                                        "organizational_funds": req.session.organizational_funds,
                                        "program_flow": req.session.programData,
                                        "projectHeads": req.session.pheadData,
                                        "breakdown_expenses": req.session.breakdownOfExpenses,
                                        "projected_income": {
                                            revenue: req.session.projRevData,
                                            expenses: req.session.porjExpData,
                                            total: req.session.projIncomeTotal
                                        },
                                        "comments": null,
                                        "position": null,
                                        "creationDate": new Date,
                                        "org": usersOrganization, //fix this later on to session
                                        "position": 0,
                                        "status": "Pending",
                                        "user_id": req.session.uid,
                                        "processType": processType,
                                        "currentCheckers": req.session.currentCheckers,
                                        "currentViewers": [],
                                        "archived": false,
                                        "prevForm_id": null
                                    });
                                    preactsService.addForm(form).then((addedForm) => {
                                        //                                    console.log(addedForm);
                                        clearSessionForm(req);
                                        res.redirect('/preacts-submission');

                                    }).catch((err) => {
                                        console.log("ERROR: Failed to add form in database");
                                        console.log(err);
                                        req.session.submissionError = true;
                                        res.redirect('/preacts-submission');
                                    });
                                }).catch((err) => {
                                    console.log(err);
                                    req.session.submissionError = true;
                                    res.redirect('/preacts-submission');
                                });
                            }).catch((err) => {
                                console.log(err);
                                req.session.submissionError = true;
                                res.redirect('/preacts-submission');
                            })
                        }).catch((err) => {
                            console.log(err);
                            req.session.submissionError = true;
                            res.redirect('/preacts-submission');
                        })
                    })
                } else {
                    roleService.getRoleWithName(role).then((retRole) => {
                        roleObj = retRole;
                        orgService.getOrgWithAbbrev(org).then((retOrg) => {
                            orgObj = retOrg;
                            userService.findUserByOrgAndRoleID(orgObj._id, roleObj._id).then((retUsers) => {
                                req.session.currentCheckers = retUsers
                                roleService.getRoleWithId(userObject.user_roles[0].role_id).then((role) => {
                                    //form creation
                                    var form = new Form({
                                        "title": req.session.title,
                                        "nature": req.session.nature,
                                        "typeOfActivity": req.session.type,
                                        "enmp": req.session.enmp,
                                        "enp": req.session.enp,
                                        "startDate": req.session.startDate,
                                        "startDateAlt": req.session.startDateAlt,
                                        "startTime": req.session.startTime,
                                        "endTime": req.session.endTime,
                                        "venue": req.session.venue,
                                        "reach": req.session.reach,
                                        "GOSM": req.session.GOSM,
                                        "online": req.session.online,
                                        "context": [req.session.context1, req.session.context2, req.session.context3],
                                        "objectives": [req.session.objective1, req.session.objective2, req.session.objective3],
                                        "person_responsible": [req.session.PR, req.session.PR_2],
                                        "source_funds": req.session.sourceFunds,
                                        "organizational_funds": req.session.organizational_funds,
                                        "program_flow": req.session.programData,
                                        "projectHeads": req.session.pheadData,
                                        "breakdown_expenses": req.session.breakdownOfExpenses,
                                        "projected_income": {
                                            revenue: req.session.projRevData,
                                            expenses: req.session.porjExpData,
                                            total: req.session.projIncomeTotal
                                        },
                                        "comments": null,
                                        "position": null,
                                        "creationDate": new Date,
                                        "org": usersOrganization, //fix this later on to session
                                        "position": 0,
                                        "status": "Pending",
                                        "user_id": req.session.uid,
                                        "processType": processType,
                                        "currentCheckers": req.session.currentCheckers,
                                        "currentViewers": [],
                                        "archived": false,
                                        "prevForm_id": null
                                    });
                                    preactsService.addForm(form).then((addedForm) => {
                                        //                                    console.log(addedForm);
                                        clearSessionForm(req);
                                        res.redirect('/preacts-submission');

                                    }).catch((err) => {
                                        console.log("ERROR: Failed to add form in database");
                                        console.log(err);
                                        req.session.submissionError = true;
                                        res.redirect('/preacts-submission');
                                    });
                                }).catch((err) => {
                                    console.log(err);
                                    req.session.submissionError = true;
                                    res.redirect('/preacts-submission');
                                });
                            }).catch((err) => {
                                console.log(err);
                                req.session.submissionError = true;
                                res.redirect('/preacts-submission');
                            })
                        }).catch((err) => {
                            console.log(err);
                            req.session.submissionError = true;
                            res.redirect('/preacts-submission');
                        })
                    })
                }


            }).catch((err) => {
                console.log("ERROR: Failed to find organization given org_id - " + org_id);
                console.log(err);
                req.session.submissionError = true;
                res.redirect('/preacts-submission');
            });
        }).catch((err) => {
            console.log("ERROR: Failed to find user given user_id - " + req.session.uid);
            console.log(err);
            req.session.submissionError = true;
            res.redirect('/preacts-submission');
        });


    });

    var clearSessionForm = function (req) {
        req.session.title = null;
        req.session.nature = null;
        req.session.type = null;
        req.session.enmp = null;
        req.session.enp = null;
        req.session.startDate = null;
        req.session.startTime = null;
        req.session.endDate = null;
        req.session.endTime = null;
        req.session.venue = null;
        req.session.reach = null;
        req.session.GOSM = null;
        req.session.online = null;
        req.session.context1 = null;
        req.session.context2 = null;
        req.session.context3 = null;
        req.session.objective1 = null;
        req.session.objective2 = null;
        req.session.objective3 = null;
        req.session.PR = null;
        req.session.PR_2 = null;
        req.session.sourceFunds = null;
        req.session.organizational_funds = null;
        req.session.programData = null;
        req.session.pheadData = null;
        req.session.breakdownOfExpenses = null;
        req.session.projRevData = null;
        req.session.porjExpData = null;
        req.session.projIncomeTotal = null;
        req.session.submissionValue = true;
    }

    app.post('/view-form', function (req, res) {

        if (!req.session.uid) res.redirect("/");

        var id = req.body.form_id;

        userService.getUserWithId(req.session.uid).then((retUser) => {
            var roleId = retUser.user_roles[0].role_id; //FIX THIS LATER ON DEPENDING ON HOW MANY ORGS THEY HAVE
            var orgId = retUser.user_roles[0].org_id;
            roleService.getRoleWithId(roleId).then((retRole) => {
                orgService.findSpecificOrg(orgId).then((orgObject) => {
                    var data = {
                        type: orgObject.type,
                        name: orgObject.name
                    }
                    preactsService.findFormViaId(id).then((form) => {
                        if (form.prevForm_id != null) {
                            preactsService.findFormViaId(form.prevForm_id).then((form2) => {
                                if (retRole.name === "PROJECT_HEAD") {
                                    res.render('viewForm', {
                                        prevForm: form2,
                                        org: data,
                                        data: form,
                                        button: false,
                                        curUser: false
                                    });
                                } else {
                                    if (isInList(form.currentCheckers, req.session.uid)){
//                                        console.log("True in form2")
                                        res.render('viewForm', {
                                            prevForm: form2,
                                            org: data,
                                            data: form,
                                            button: true,
                                            curUser: true
                                        });
                                    } else {
//                                        console.log("False in form2")
                                        res.render('viewForm', {
                                            prevForm: form2,
                                            org: data,
                                            data: form,
                                            button: true,
                                            curUser: false
                                        });
                                    }
                                    
                                }
                            })
                        } else {
                            if (retRole.name === "PROJECT_HEAD") {
                                res.render('viewForm', {
                                    prevForm: null,
                                    org: data,
                                    data: form,
                                    button: false,
                                    curUser: false
                                });
                            } else {
                                if (isInList(form.currentCheckers, req.session.uid)){
//                                    console.log("True in Null")
                                    res.render('viewForm', {
                                        prevForm: null,
                                        org: data,
                                        data: form,
                                        button: true,
                                        curUser: true
                                    });
                                } else {
//                                    console.log("False in Null")
                                    res.render('viewForm', {
                                        prevForm: null,
                                        org: data,
                                        data: form,
                                        button: true,
                                        curUser: false
                                    });
                                }
                                
                            }
                        }
                    }, (error) => {
                        console.error(error);
                    });

                }).catch((err) => {
                    console.log("ERROR MESSAGE: Cannot find org with id " + orgId);
                    console.log(err);
                });
            }).catch((err) => {
                console.log("ERROR MESSAGE: Cannot find role with id " + orgId);
                console.log(err);
            });
        }).catch((err) => {
            console.log("ERROR MESSAGE: Cannot find user with id " + orgId);
            console.log(err);
        });
    });
    
    function isInList(someList, value){
        var truth = false;
        someList.forEach(function(item){
//            console.log(item)
//            console.log(value)
            if (item == value){
                truth = true;
            }
        })
        console.log("TRUTH VALUE: "+ truth)
        return truth;
    }

    app.post('/editForm', function (req, res) {
        if (!req.session.uid) res.redirect("/");

        var id = req.body.form_id;

        userService.getUserWithId(req.session.uid).then((retUser) => {
            var roleId = retUser.user_roles[0].role_id; //FIX THIS LATER ON DEPENDING ON HOW MANY ORGS THEY HAVE
            var orgId = retUser.user_roles[0].org_id;
            roleService.getRoleWithId(roleId).then((retRole) => {
                orgService.findSpecificOrg(orgId).then((orgObject) => {
                    if (retRole.name != "PROJECT_HEAD") {
                        res.redirect('/preacts');
                    } else {
                        preactsService.findFormViaId(id).then((form) => {
                            var data = {
                                form: form,
                                type: orgObject.type,
                                name: orgObject.name
                            }
                            res.render('editForm', {
                                data: data
                            });
                        });
                    }
                }).catch((err) => {
                    console.log("ERROR MESSAGE: Cannot find org with id " + orgId);
                    console.log(err);
                });
            }).catch((err) => {
                console.log("ERROR MESSAGE: Cannot find role with id " + roleId);
                console.log(err);
            });
        }).catch((err) => {
            console.log("ERROR MESSAGE: Cannot find user with id " + req.session.uid);
            console.log(err);
        });
    });

    //confirm edited page
    app.post('/edit-form-confirm', function (req, res) {
        //        console.log(req.body)
        if (!req.session.uid) res.redirect("/");
        var oldForm = req.body.oldForm_id;
        console.log(oldForm);

        var isSlife = false;
        req.session.submissionValue = false;
        req.session.title = req.body.title;
        req.session.nature = req.body.nature;
        if (req.body.type.split("-")[0] == 'SLIFE') {
            isSlife = true;
            if (req.body.type.split("-")[1] == 'Others') {
                req.session.type = req.body.typeOthers2;
            } else {
                req.session.type = req.body.type.split("-")[1];
            }
        } else {
            if (req.body.type.split("-")[1] == 'Others') {
                req.session.type = req.body.typeOthers;
            } else {
                req.session.type = req.body.type.split("-")[1];
            }
        }

        req.session.startDate = req.body.startDate;
        req.session.startTime = req.body.startTime;
        req.session.endTime = req.body.endTime;
        req.session.venue = req.body.venue;
        req.session.enmp = req.body.enmp;
        req.session.enp = req.body.enp;
        req.session.reach = req.body.reach;
        if (req.body.online == 'yes') {
            req.session.online = true;
        } else {
            req.session.online = false;
        }
        if (req.body.GOSM == 'yes') {
            req.session.GOSM = true;
        } else {
            req.session.GOSM = false;
        }

        req.session.context1 = req.body.context1;
        req.session.context2 = req.body.context2;
        req.session.context3 = req.body.context3;
        req.session.objective1 = req.body.objective1;
        req.session.objective2 = req.body.objective2;
        req.session.objective3 = req.body.objective3;

        //accessing data from project head table
        var pheadData = [];

        var pheadlength = parseInt(req.body.dynamicTable1len, 10) + 1;
        for (var i = 0; i < pheadlength; i++) {
            var rowdata = {
                name: req.body['phead_name' + i],
                contact_number: req.body['phead_number' + i]
            }
            pheadData.push(rowdata);
        }
        req.session.pheadData = pheadData;
        //console.log("PHEAD LENGTH: " + pheadlength)

        //accessing data from comprehensive program design table
        var programData = [];
        var programlength = parseInt(req.body.dynamicTable2len, 10) + 1;
        for (var i = 0; i < programlength; i++) {
            var start = req.body['startTime' + i].split(":");
            var end = req.body['endTime' + i].split(":");
            var dur = new duration(new Date(0, 0, 0, start[0], start[1], 0, 0), new Date(0, 0, 0, end[0], end[1], 0, 0));

            var rowdata = {
                startTime: req.body['startTime' + i],
                endTime: req.body['endTime' + i],
                duration: dur.minutes,
                activity: req.body['activity' + i],
                description: req.body['description' + i],
                person: req.body['person' + i]
            }
            programData.push(rowdata);
        }
        req.session.programData = programData;

        req.session.PR = {
            name: req.body.namePR,
            position: req.body.positionPR
        }

        req.session.PR_2 = {
            name: req.body.namePR2,
            position: req.body.positionPR2
        }

        if(req.body.expenses == 1) {
            req.session.sourceFunds = {
                organization_funds: req.body.OrganizationalFunds,
                participants_fee: req.body.ParticipantsFee,
                others: req.body.OtherFunds,
                total: parseFloat(req.body.OrganizationalFunds) + parseFloat(req.body.ParticipantsFee) + parseFloat(req.body.OtherFunds)
            }
            
            //accessing data from breakdown of expenses table
            var expensesData = [];
            var expenseslength = parseInt(req.body.dynamicTable3len, 10) + 1;
            var totalExpenses = 0.00;
            for (var i = 0; i < expenseslength; i++) {
                var rowdata = {
                    name: req.body['material' + i],
                    quantity: req.body['quantity' + i],
                    unit_cost: req.body['unit' + i],
                    total_cost: req.body['quantity' + i] * req.body['unit' + i]
                }
                totalExpenses = rowdata.total_cost + totalExpenses;
                expensesData.push(rowdata);
            }
            req.session.breakdownOfExpenses = {
                material: expensesData,
                total_expense: totalExpenses
            }
            
            //accessing data from projected expenses table
            var projExpData = [],
                totalExp = 0;
            var projExplength = parseInt(req.body.dynamicTable5len, 10) + 1;
            for (var i = 0; i < projExplength; i++) {
                var rowdata = {
                    item: req.body['it' + i],
                    quantity: req.body['qu' + i],
                    price: req.body['pr' + i],
                    amount: req.body['qu' + i] * req.body['pr' + i]
                }
                totalExp = totalExp + req.body['qu' + i] * req.body['pr' + i]
                projExpData.push(rowdata);
            }
            req.session.porjExpData = projExpData;
        } else {
            console.log("NO EXPENSES");
            req.session.sourceFunds = {
                organization_funds: null,
                participants_fee: null,
                others: null,
                total: null
            };
            req.session.breakdownOfExpenses = {
                material: null,
                total_expense: null
            };
            totalExpenses = 0;
            req.session.porjExpData = 0;
        }

        //        req.session.boeTotal = req.body.boeTotal;
        req.session.organizational_funds = {
            operational_fund: req.body.OperationalFund,
            depository_fund: req.body.DepositoryFund,
            other_fund: req.body.OtherFund,
            //accumulated_fund: req.body.AccumulatedFund,
            total_disbursement: parseFloat(req.body.OperationalFund) + parseFloat(req.body.DepositoryFund) + parseFloat(req.body.OtherFund),
            projected_expenses: totalExpenses,
            rem_balance: parseFloat(req.body.OperationalFund) + parseFloat(req.body.DepositoryFund) + parseFloat(req.body.OtherFund) - totalExpenses
        }
        
        if(req.body.income == 1) {
            //accessing data from projected revenue table
            var projRevData = [],
                totalRev = 0.00;
            var projRevlength = parseInt(req.body.dynamicTable4len, 10) + 1;
            for (var i = 0; i < projRevlength; i++) {
                var rowdata = {
                    item: req.body['item' + i],
                    quantity: req.body['qty' + i],
                    price: req.body['price' + i],
                    amount: req.body['qty' + i] * req.body['price' + i]
                }
                totalRev = totalRev + req.body['qty' + i] * req.body['price' + i];
                projRevData.push(rowdata);
            }
            req.session.projRevData = projRevData;
            req.session.projIncomeTotal = totalRev - totalExp;
        } else {
            req.session.projRevData = null;
            req.session.porjExpData = null;
            req.session.projIncomeTotal = null;
        }
        
        var usersOrganization, processType;
        userService.getUserWithId(req.session.uid).then((userObject) => {
            var org_id = userObject.user_roles[0].org_id;
            orgService.findSpecificOrg(org_id).then((orgObject) => {
                usersOrganization = orgObject.name;
                var batchGovNames = ["CATCH", "BLAZE", "FAST", "ENG", "FOCUS", "EDGE", "EXCEL"]
                //if statements to see what process the form should go under - still in progress
                if (orgObject.type == 'CSO') {
                    processType = "ORGANIZATIONS_PROCESS"
                    if (isSlife) {
                        processType = processType + "-SLIFE"
                    } else {
                        processType = processType + "-CSO"
                    }
                } else {
                    processType = "GOVERNMENT_PROCESS"
                    if (orgObject.abbrev.includes(batchGovNames[0]) || orgObject.abbrev.includes(batchGovNames[1]) || orgObject.abbrev.includes(batchGovNames[2]) || orgObject.abbrev.includes(batchGovNames[3]) || orgObject.abbrev.includes(batchGovNames[4]) || orgObject.abbrev.includes(batchGovNames[5]) || orgObject.abbrev.includes(batchGovNames[6])) {
                        processType = processType + "-BATCH"
                    } else if (orgObject.abbrev.includes("CG")) {
                        processType = processType + "-COLLEGE"
                    } else {
                        processType = processType + "-USG"
                    }
                    if (isSlife) {
                        processType = processType + "-SLIFE"
                    } else {
                        processType = processType + "-DAAM"
                    }
                }


                preactsService.findFormViaId(oldForm).then((old) => {
                    console.log("DEBUG: PROCESS TYPE -> " + processType)
                    var org, role, orgObj, roleObj;
                    var str = processes[processType][old.position];
                    //                console.log(str)

                    var temp = str.split("-", 2);
                    //                console.log(temp)
                    org = temp[1];
                    role = temp[0];

                    if (org == 'ORG') {
                        roleService.getRoleWithName(role).then((retRole) => {
                            roleObj = retRole;
                            orgService.getOrgWithName(usersOrganization).then((retOrg) => {
                                orgObj = retOrg;
                                userService.findUserByOrgAndRoleID(orgObj._id, roleObj._id).then((retUsers) => {
                                    req.session.currentCheckers = retUsers
                                    roleService.getRoleWithId(userObject.user_roles[0].role_id).then((role) => {
                                        preactsService.findFormViaId(oldForm).then((old) => {
                                            var form = new Form({
                                                "title": req.session.title,
                                                "nature": req.session.nature,
                                                "typeOfActivity": req.session.type,
                                                "enmp": req.session.enmp,
                                                "enp": req.session.enp,
                                                "startDate": req.session.startDate,
                                                "startDateAlt": req.session.startDateAlt,
                                                "startTime": req.session.startTime,
                                                "endDate": req.session.endDate,
                                                "endTime": req.session.endTime,
                                                "venue": req.session.venue,
                                                "reach": req.session.reach,
                                                "GOSM": req.session.GOSM,
                                                "online": req.session.online,
                                                "context": [req.session.context1, req.session.context2, req.session.context3],
                                                "objectives": [req.session.objective1, req.session.objective2, req.session.objective3],
                                                "person_responsible": [req.session.PR, req.session.PR_2],
                                                "source_funds": req.session.sourceFunds,
                                                "organizational_funds": req.session.organizational_funds,
                                                "program_flow": req.session.programData,
                                                "projectHeads": req.session.pheadData,
                                                "breakdown_expenses": req.session.breakdownOfExpenses,
                                                "projected_income": {
                                                    revenue: req.session.projRevData,
                                                    expenses: req.session.porjExpData,
                                                    total: req.session.projIncomeTotal
                                                },
                                                "comments": null,
                                                "position": null,
                                                "creationDate": new Date,
                                                "org": usersOrganization, //fix this later on to session
                                                "position": old.position,
                                                "status": "Pending",
                                                "user_id": req.session.uid,
                                                "processType": processType,
                                                "currentCheckers": req.session.currentCheckers,
                                                "currentViewers": old.currentViewers,
                                                "archived": false,
                                                "prevForm_id": oldForm
                                            });
                                            preactsService.addForm(form).then((addedForm) => {
                                                old.archived = true;
                                                preactsService.updateForm(old).then((updatedForm) => {
                                                    preactsService.findFormViaId(old._id).then((formData1) => {
                                                        console.log(formData1.archived);
                                                        clearSessionForm(req);
                                                        res.redirect('/preacts-submission');
                                                    })
                                                });
                                            }).catch((err) => {
                                                console.log("ERROR: Failed to add form in database");
                                                console.log(err);
                                                req.session.submissionError = true;
                                                res.redirect('/preacts-submission');
                                            });


                                        }).catch((err) => {
                                            console.log(err);
                                            req.session.submissionError = true;
                                            res.redirect('/preacts-submission');
                                        })

                                    }).catch((err) => {
                                        console.log(err);
                                        req.session.submissionError = true;
                                        res.redirect('/preacts-submission');
                                    });
                                }).catch((err) => {
                                    req.session.submissionError = true;
                                    res.redirect('/preacts-submission');
                                })
                            }).catch((err) => {
                                req.session.submissionError = true;
                                res.redirect('/preacts-submission');
                            })
                        })
                    } else if (org == 'BATCH') {
                        roleService.getRoleWithName(role).then((retRole) => {
                            roleObj = retRole;
                            orgService.getOrgWithName(usersOrganization).then((retOrg) => {
                                orgObj = retOrg;
                                userService.findUserByOrgAndRoleID(orgObj._id, roleObj._id).then((retUsers) => {
                                    req.session.currentCheckers = retUsers
                                    roleService.getRoleWithId(userObject.user_roles[0].role_id).then((role) => {
                                        preactsService.findFormViaId(oldForm).then((old) => {
                                            var form = new Form({
                                                "title": req.session.title,
                                                "nature": req.session.nature,
                                                "typeOfActivity": req.session.type,
                                                "enmp": req.session.enmp,
                                                "enp": req.session.enp,
                                                "startDate": req.session.startDate,
                                                "startDateAlt": req.session.startDateAlt,
                                                "startTime": req.session.startTime,
                                                "endDate": req.session.endDate,
                                                "endTime": req.session.endTime,
                                                "venue": req.session.venue,
                                                "reach": req.session.reach,
                                                "GOSM": req.session.GOSM,
                                                "online": req.session.online,
                                                "context": [req.session.context1, req.session.context2, req.session.context3],
                                                "objectives": [req.session.objective1, req.session.objective2, req.session.objective3],
                                                "person_responsible": [req.session.PR, req.session.PR_2],
                                                "source_funds": req.session.sourceFunds,
                                                "organizational_funds": req.session.organizational_funds,
                                                "program_flow": req.session.programData,
                                                "projectHeads": req.session.pheadData,
                                                "breakdown_expenses": req.session.breakdownOfExpenses,
                                                "projected_income": {
                                                    revenue: req.session.projRevData,
                                                    expenses: req.session.porjExpData,
                                                    total: req.session.projIncomeTotal
                                                },
                                                "comments": null,
                                                "position": null,
                                                "creationDate": new Date,
                                                "org": usersOrganization, //fix this later on to session
                                                "position": old.position,
                                                "status": "Pending",
                                                "user_id": req.session.uid,
                                                "processType": processType,
                                                "currentCheckers": req.session.currentCheckers,
                                                "currentViewers": old.currentViewers,
                                                "archived": false,
                                                "prevForm_id": oldForm
                                            });
                                            preactsService.addForm(form).then((addedForm) => {
                                                old.archived = true;
                                                preactsService.updateForm(old).then((updatedForm) => {
                                                    preactsService.findFormViaId(old._id).then((formData1) => {
                                                        console.log(formData1.archived);
                                                        clearSessionForm(req);
                                                        res.redirect('/preacts-submission');
                                                    })
                                                });
                                            }).catch((err) => {
                                                console.log("ERROR: Failed to add form in database");
                                                console.log(err);
                                                req.session.submissionError = true;
                                                res.redirect('/preacts-submission');
                                            });


                                        }).catch((err) => {
                                            console.log(err);
                                            req.session.submissionError = true;
                                            res.redirect('/preacts-submission');
                                        })

                                    }).catch((err) => {
                                        console.log(err);
                                        req.session.submissionError = true;
                                        res.redirect('/preacts-submission');
                                    });
                                }).catch((err) => {
                                    req.session.submissionError = true;
                                    res.redirect('/preacts-submission');
                                })
                            }).catch((err) => {
                                req.session.submissionError = true;
                                res.redirect('/preacts-submission');
                            })
                        })
                    } else if (org == 'COLLEGE') {
                        var collegeName;
                        roleService.getRoleWithName(role).then((retRole) => {
                            roleObj = retRole;
                            orgService.getOrgWithName(usersOrganization).then((retOrg) => {
                                orgObj = retOrg;
                                if (orgObj.abbrev.includes("BLAZE")) {
                                    collegeName = "COB_CG"
                                } else if (orgObj.abbrev.includes("FAST")) {
                                    collegeName = "CLA_CG"
                                } else if (orgObj.abbrev.includes("ENG")) {
                                    orgObj = "COE_CG"
                                } else if (orgObj.abbrev.includes("CATCH")) {
                                    collegeName = "CCS_CG"
                                } else if (orgObj.abbrev.includes("FOCUS")) {
                                    collegeName = "COS_CG"
                                } else if (orgObj.abbrev.includes("EDGE")) {
                                    collegeName = "CED_CG"
                                } else if (orgObj.abbrev.includes("EXCEL")) {
                                    collegeName = "SOE_CG"
                                }
                                orgService.getOrgWithAbbrev(collegeName).then((retuOrg)=>{
                                    userService.findUserByOrgAndRoleID(retuOrg._id, roleObj._id).then((retUsers) => {
                                        req.session.currentCheckers = retUsers
                                        roleService.getRoleWithId(userObject.user_roles[0].role_id).then((role) => {
                                            preactsService.findFormViaId(oldForm).then((old) => {
                                                var form = new Form({
                                                    "title": req.session.title,
                                                    "nature": req.session.nature,
                                                    "typeOfActivity": req.session.type,
                                                    "enmp": req.session.enmp,
                                                    "enp": req.session.enp,
                                                    "startDate": req.session.startDate,
                                                    "startDateAlt": req.session.startDateAlt,
                                                    "startTime": req.session.startTime,
                                                    "endDate": req.session.endDate,
                                                    "endTime": req.session.endTime,
                                                    "venue": req.session.venue,
                                                    "reach": req.session.reach,
                                                    "GOSM": req.session.GOSM,
                                                    "online": req.session.online,
                                                    "context": [req.session.context1, req.session.context2, req.session.context3],
                                                    "objectives": [req.session.objective1, req.session.objective2, req.session.objective3],
                                                    "person_responsible": [req.session.PR, req.session.PR_2],
                                                    "source_funds": req.session.sourceFunds,
                                                    "organizational_funds": req.session.organizational_funds,
                                                    "program_flow": req.session.programData,
                                                    "projectHeads": req.session.pheadData,
                                                    "breakdown_expenses": req.session.breakdownOfExpenses,
                                                    "projected_income": {
                                                        revenue: req.session.projRevData,
                                                        expenses: req.session.porjExpData,
                                                        total: req.session.projIncomeTotal
                                                    },
                                                    "comments": null,
                                                    "position": null,
                                                    "creationDate": new Date,
                                                    "org": usersOrganization, //fix this later on to session
                                                    "position": old.position,
                                                    "status": "Pending",
                                                    "user_id": req.session.uid,
                                                    "processType": processType,
                                                    "currentCheckers": req.session.currentCheckers,
                                                    "currentViewers": old.currentViewers,
                                                    "archived": false,
                                                    "prevForm_id": oldForm
                                                });
                                                preactsService.addForm(form).then((addedForm) => {
                                                    old.archived = true;
                                                    preactsService.updateForm(old).then((updatedForm) => {
                                                        preactsService.findFormViaId(old._id).then((formData1) => {
                                                            console.log(formData1.archived);
                                                            clearSessionForm(req);
                                                            res.redirect('/preacts-submission');
                                                        })
                                                    });
                                                }).catch((err) => {
                                                    console.log("ERROR: Failed to add form in database");
                                                    console.log(err);
                                                    req.session.submissionError = true;
                                                    res.redirect('/preacts-submission');
                                                });


                                            }).catch((err) => {
                                                console.log(err);
                                                req.session.submissionError = true;
                                                res.redirect('/preacts-submission');
                                            })

                                        }).catch((err) => {
                                            console.log(err);
                                            req.session.submissionError = true;
                                            res.redirect('/preacts-submission');
                                        });
                                    }).catch((err) => {
                                        req.session.submissionError = true;
                                        res.redirect('/preacts-submission');
                                    })
                                }).catch((err)=>{
                                    req.session.submissionError = true;
                                    res.redirect('/preacts-submission')
                                })
                                
                            }).catch((err) => {
                                req.session.submissionError = true;
                                res.redirect('/preacts-submission');
                            })
                        })
                    } else {
                        roleService.getRoleWithName(role).then((retRole) => {
                            roleObj = retRole;
                            orgService.getOrgWithAbbrev(org).then((retOrg) => {
                                orgObj = retOrg;
                                userService.findUserByOrgAndRoleID(orgObj._id, roleObj._id).then((retUsers) => {
                                    req.session.currentCheckers = retUsers
                                    roleService.getRoleWithId(userObject.user_roles[0].role_id).then((role) => {
                                        preactsService.findFormViaId(oldForm).then((old) => {
                                            var form = new Form({
                                                "title": req.session.title,
                                                "nature": req.session.nature,
                                                "typeOfActivity": req.session.type,
                                                "enmp": req.session.enmp,
                                                "enp": req.session.enp,
                                                "startDate": req.session.startDate,
                                                "startDateAlt": req.session.startDateAlt,
                                                "startTime": req.session.startTime,
                                                "endDate": req.session.endDate,
                                                "endTime": req.session.endTime,
                                                "venue": req.session.venue,
                                                "reach": req.session.reach,
                                                "GOSM": req.session.GOSM,
                                                "online": req.session.online,
                                                "context": [req.session.context1, req.session.context2, req.session.context3],
                                                "objectives": [req.session.objective1, req.session.objective2, req.session.objective3],
                                                "person_responsible": [req.session.PR, req.session.PR_2],
                                                "source_funds": req.session.sourceFunds,
                                                "organizational_funds": req.session.organizational_funds,
                                                "program_flow": req.session.programData,
                                                "projectHeads": req.session.pheadData,
                                                "breakdown_expenses": req.session.breakdownOfExpenses,
                                                "projected_income": {
                                                    revenue: req.session.projRevData,
                                                    expenses: req.session.porjExpData,
                                                    total: req.session.projIncomeTotal
                                                },
                                                "comments": null,
                                                "position": null,
                                                "creationDate": new Date,
                                                "org": usersOrganization, //fix this later on to session
                                                "position": old.position,
                                                "status": "Pending",
                                                "user_id": req.session.uid,
                                                "processType": processType,
                                                "currentCheckers": req.session.currentCheckers,
                                                "currentViewers": old.currentViewers,
                                                "archived": false,
                                                "prevForm_id": oldForm
                                            });
                                            preactsService.addForm(form).then((addedForm) => {
                                                old.archived = true;
                                                preactsService.updateForm(old).then((updatedForm) => {
                                                    preactsService.findFormViaId(old._id).then((formData1) => {
                                                        console.log(formData1.archived);
                                                        clearSessionForm(req);
                                                        res.redirect('/preacts-submission');
                                                    })
                                                });
                                            }).catch((err) => {
                                                console.log("ERROR: Failed to add form in database");
                                                console.log(err);
                                                req.session.submissionError = true;
                                                res.redirect('/preacts-submission');
                                            });


                                        }).catch((err) => {
                                            console.log(err);
                                            req.session.submissionError = true;
                                            res.redirect('/preacts-submission');
                                        })

                                    }).catch((err) => {
                                        console.log(err);
                                        req.session.submissionError = true;
                                        res.redirect('/preacts-submission');
                                    });
                                }).catch((err) => {
                                    req.session.submissionError = true;
                                    res.redirect('/preacts-submission');
                                })
                            }).catch((err) => {
                                req.session.submissionError = true;
                                res.redirect('/preacts-submission');
                            })
                        })
                    }
                }).catch((err) => {

                    console.log(err);
                    req.session.submissionError = true;
                    res.redirect('/preacts-submission');
                });
            }).catch((err) => {
                console.log("ERROR: Failed to find organization given org_id - " + org_id);
                console.log(err);
                req.session.submissionError = true;
                res.redirect('/preacts-submission');
            });
        }).catch((err) => {
            console.log("ERROR: Failed to find user given user_id - " + req.session.uid);
            console.log(err);
            req.session.submissionError = true;
            res.redirect('/preacts-submission');
        })
    });
}