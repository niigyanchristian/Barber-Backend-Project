require('dotenv').config();
const express = require("express");
const bodyParser = require('express').json;
const mongoose = require("mongoose");
const multer = require("multer");
const _ = require('lodash');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');


const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "./uploads/")
    },
    filename: function(req, file, cb){
        cb(null, new Date().toDateString()+file.originalname);
    }
});

const fileFilter = (req, file, cb)=>{
    
    if(file.mimetype === "image/jpeg" || file.mimetype === "image/png"){
        //recieve file
        cb(null,true);
    }else{
        //reject file
        cb(null, false);
    }
};

const upload = multer({
    storage: storage, 
    limits: {
     fieldSize: 1024 * 1024 * 5
    },
    fileFilter: fileFilter
});


const app = express(); 
app.use("/uploads",express.static('uploads'));
app.use(bodyParser());

// app.use(session({
//     secret: 'This is Jay Mills project made by Christian',
//     resave: false,
//     saveUninitialized: false
// }));

// app.use(passport.initialize());
// app.use(passport.session());

mongoose.connect(process.env.URL,{useNewUrlParser: true});

const shopSchema = {
    ShopID:String,
    email:String,
    category: String,
    shopName: String,
    region: String,
    city: String,
    landMark: String,
    businessNumber: String,
    discription: String,
    image: String
};

const userSchema = new mongoose.Schema({
    Name: String,
    email: String,
    password: String,
    phone: String,
    DOB: String,
    ID: String,
    shop: {
        type: shopSchema,
        default: null
    }
});

// userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);
const Shop = new mongoose.model("Shop", shopSchema);

// passport.use(User.createStrategy());

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());



//END POINTS


app.post("/register", (req,res)=>{
    let {username,password,email,phone,dob} = req.body;
    const ID = _.kebabCase(email);
    User.findOne({ID:ID}, (err,user)=>{
        if(err){
            res.status(404).send(err.message);
        }else{
            if(user){
                res.status(403).send("User with the email( "+email+" ) alredy exist");
            }else{
                const client = new User({
                    Name: _.upperFirst(username),
                    ID:  ID,
                    email: email,
                    password: password,
                    phone: phone,
                    DOB: dob
                });
                client.save((err)=>{
                    if(!err){
                        res.status(200).send(client);
                    }else{
                        res.status(401).send("Unable to regiser user");
                    }
                });
            }
        }
    });
});

app.post("/login", (req,res)=>{
    let {email,password} = req.body;
    const ID = _.kebabCase(email);
    User.findOne({ID:ID},(err,found)=>{
        if(err){
            res.status(400).send(err.message);
        }else{
            if(found){
                if(found.password== password){
                    res.status(200).send(found);  
                }else{
                    res.status(401).send('wrong password');
                }
            }else{
                res.status(401).send("wrong credentials");
            }
        }
    });
});



app.post("/addShop",(req,res)=>{
    let {ShopID,email,category,shopName,region,city,landMark,businessNumber,discription,image} = req.body;
    // const shopID = _.kebabCase(email+businessNumber);
    const ID = _.kebabCase(email);
    const shopname = _.upperFirst(shopName);
    // //check whether client exist 
    User.findOne({ID:ID}, (err, find)=>{
        console.log("user was found");
        if(!err){
            if(find){
                //check wether shop name exist already
                Shop.findOne({shopName:shopname}, (err,foundShop)=>{
                    if(!err){
                        if(foundShop){
                            res.status(403).send("Shop already exist");
                        }else{
                            //save shop
                            const shop = new Shop({
                                ShopID:ID,
                                category: _.upperFirst(category),
                                shopName: _.upperFirst(shopName),
                                region: _.upperFirst(region),
                                city: _.upperFirst(city),
                                landMark: _.upperFirst(landMark),
                                businessNumber: businessNumber,
                                discription: discription,
                                image: image
                            });
                            const item = {
                                ShopID:ID,
                                category: _.upperFirst(category),
                                shopName: _.upperFirst(shopName),
                                region: _.upperFirst(region),
                                city: _.upperFirst(city),
                                landMark: _.upperFirst(landMark),
                                businessNumber: businessNumber,
                                discription: discription,
                                image: image
                            }
                            shop.save((err)=>{
                                if(!err){
                                    //Now update the client by adding the shop
                                    const updtae = find.shop;
                                    const updatedShop= item;
                                    console.log(updatedShop);
                                    User.findOneAndUpdate({ID:ID}, {shop: updatedShop}, (err)=>{
                                        if(!err){
                                            //Find the client details and send it to the client
                                            User.findOne({ID:ID},(err,client)=>{
                                                if(!err){
                                                    res.status(200).send(client);
                                                }else{
                                                    res.status(505).send();
                                                }
                                            })
                                        }
                                    });
                                }else{
                                    res.status(401).send(err);
                                }
                            });
                        }
                    }else{
                        res.status(404).send();
                    }
                });
               
            }else{
                res.status(404).send("user not found");
            }
        }else{
            res.send(err);
        }
        
    }); 
});

app.get("/filter/:category", (req,res)=>{
    const category = _.lowerCase(req.params.category)
    console.log(category);
    Shop.find({category:_.upperFirst(category)},(err, found)=>{
        if(!err){
            if(found){
                // found.forEach(element => {
                    res.status(200).send(found); 
                // });
            }else{
                res.status(404).send("Category not found");
            }
        }else{
            res.status(505).send();
        }
    });
});



// app.post("/try", upload.single("shopImage") ,(req,res)=>{
 
//     // //check whether client exist 
//     Client.findOne({ID:req.body.businessNumber}, (err, find)=>{
//         if(!err){
//             if(find){
//                 //check wether shop name exist already
//                 Shop.findOne({shopName:_.upperFirst(req.body.shopName)}, (err,foundShop)=>{
//                     if(!err){
//                         if(foundShop){
//                             res.status(403).send("Shop already exist");
//                         }else{
//                             //save shop
//                             const shop = new Shop({
//                                 category: _.upperFirst(req.body.category),
//                                 shopName: _.upperFirst(req.body.shopName),
//                                 region: _.upperFirst(req.body.region),
//                                 city: _.upperFirst(req.body.city),
//                                 landMark: _.upperFirst(req.body.landMark),
//                                 businessNumber: req.body.businessNumber,
//                                 whatsAppNumber: req.body.whatsAppNumber,
//                                 discription: req.body.discription,
//                             });
//                             const hi = find.shop.push(shop)
//                             console.log(hi);
//                         }
//                     }else{
//                         res.status(404).send();
//                     }
//                 });
//             }else{
//                 res.status(404).send("user not found");
//             }
//         }else{
//             res.send(err);
//         }
        
//     }); 
// });


app.post("/upload",upload.single("shopImage"),(req,res)=>{
    console.log(req.file);
    res.send("sent");
})











app.listen(process.env.PORT ||3000,()=>{
    console.log("Barber Shop Backend Is Running On Port 3000");
});