var preacts_app = new Vue({
    el: '#preacts',
    data: {
        filter: {
            status: [
                "Early Complete",
                "Late Complete",
                "Early Incomplete",
                "Late Incomplete",
                "Acknowledgement Cancellation"
            ],
            colleges: [
                "Liberal Arts (CLA)",
                "Computer Studies (CCS)",
                "Engineering (GCOE)",
                "Business (RVM-COB)",
                "Education (BAG-CED)",
                "Economics (SOE)",
                "Science (COS)"
            ]
        },
        whoami: null,
        quickview: null,
        forms: null,
        searchQuery: ''
    },
    created: function () {
        axios.get('/whoami')
            .then((rows) => {
                console.log(rows);
                this.whoami = rows.data.user;
                //console.log(this.whoami._id)
            //this.whoami._id
                axios.get('/preacts/getAllForms/forms/' + this.whoami._id).then((rows) => {
                    console.log(rows);
                    this.forms = rows.data.forms;
                    return this.forms;
                })
                return this.whoami;
            })


        //        axios.get('/preacts/getAllForms/forms/' + whoami._id).then((rows)=>{
        //                console.log(rows);
        //                this.forms = rows.data.forms;
        //                return this.forms;
        //        })
    },
    methods: {
        quickviewForm(_id) {
            axios.get('preacts/' + _id)
                .then((response) => {
                    if (response.error != undefined)
                        $("#error_msg").html(response.error)
                    else {
                        Vue.set(preacts_app, 'quickview', response.data.form);
                    }
                })
        },
        approveForm(_id) {
            axios.post("/preacts/approve/" + _id)
                .then((response) => {
                    if (response.error != undefined)
                        $("#error_msg").html(response.error)
                    else {
                        Vue.set(preacts_app, 'quickview', response.data.formData1);
                        location.reload(true);
                    }
                })
            axios.get('/preacts/getAllForms/forms').then((rows) => {
                console.log(rows);
                this.forms = rows.data.forms;
                //                return this.forms;
            })
        },
        rejectForm(_id) {
            axios.post("/preacts/reject/" + _id)
                .then((response) => {
                    if (response.error != undefined)
                        $("#error_msg").html(response.error)
                    else {
                        Vue.set(preacts_app, 'quickview', response.data.formData1);
                        location.reload(true);
                    }
                })
            axios.get('/preacts/getAllForms/forms').then((rows) => {
                console.log(rows);
                this.forms = rows.data.forms;
                //                return this.forms;
            })
        },    
        removeSearchQuery: function() {
          this.searchQuery = '';
          this.isResult = false;
//            console.log("test2");
        },
        submitSearch: function() {            
            console.log(this.searchQuery);
                        
            axios.get('/whoami')
                .then((rows) => {
                    if(this.searchQuery == ""){                        
                        this.whoami = rows.data.user;                        
                        axios.get('/preacts/getAllForms/forms/' + this.whoami._id).then((rows) => {
                            this.forms = rows.data.forms;
                            return this.forms;
                        })  
                    }
                    else{
                        console.log("Here!");
                        this.whoami = rows.data.user;
                        axios.get('/preacts/getAllFormsWithMatchingString/forms/' + this.whoami._id + '/' + this.searchQuery).then((rows) => {
                            this.forms = rows.data.forms;
                            return this.forms;
                        })
                    }
                })
              
            console.log(this.forms);
        }
    }
})
