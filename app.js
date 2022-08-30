const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js")

mongoose.connect("mongodb+srv://admin-sid:test123@cluster0.t7cszq8.mongodb.net/todolistDB");

const itemsSchema = {
    name: String
};

const Items = mongoose.model("Item", itemsSchema);

const item1 = new Items({
    name: "Welcome to your todolist!"
})
const item2 = new Items({
    name: "Hit the + button to add the new item!"
})
const item3 = new Items({
    name: "<-- hit this to delete the item!"
})

const defaultItems = [item1, item2, item3];






let work = [];
const app = express();

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static("public"));

app.set("view engine", "ejs"); //tells app to use ejs

app.get("/", function (req, res) {

    // const day = date.getDate();
    Items.find({}, function (err, foundItems) {

        if (foundItems.length == 0) {
            Items.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("successfully saved default items to DB.");
                }
            });

            res.redirect("/");
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItem: foundItems
            });
        }


    })



});



const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);


app.get("/:customListName", function(req, res){

    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //create a new list
                const list = new List({
                    name: customListName,
                    items: defaultItems
                })
                list.save();
                res.redirect("/" + customListName)
            } 
            else{
                //show existing list
                res.render("list",{listTitle: foundList.name, newListItem: foundList.items});
            }
        }
    })

    

    
    
})

app.post("/delete", function(req, res){
    const checkboxItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Items.findByIdAndRemove(checkboxItemId, function(err){
            if (!err){
                console.log("successfully removed the item!");
                res.redirect("/")
            }
        });
    }
    else{
        //pull item from items array that has corresponding id of checkedItemId and delete.
        List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkboxItemId}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        }); 
    }

  
})



app.post("/", function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Items({
        name: itemName
    });

    if(listName === "Today"){
        item.save();
        res.redirect("/");
    }
    else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        })
    }
    

    // console.log(item);
    // if (req.body.list === "Work List") {
    //     work.push(item);
    //     res.redirect("/work");
    // }else {
    //     items.push(item);
    //     res.redirect("/");
    // }

});

// let port = process.env.PORT;
// if (port == null || port == "") {
//   port = 3000;
// }

// app.listen(port, function () {
//     console.log("Server has started successfully.");
// });

app.listen(process.env.PORT || 3000, function(){
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
  });