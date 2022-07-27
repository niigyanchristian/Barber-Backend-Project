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

mongoose.connect(process.env.URLS,{useNewUrlParser: true});


const shopPhotosSchema = {
    photoUri: String,
    shopPhotoID: String
}

const shopWorkersSchema={
    WorkerID: String,
    name: String,
    age: String,
    number: String,
    rate: String,
    email:String,
    category: String,
    about:String,
    address:String,
    profileImage:{
        type: String,
        default: process.env.PFP
    },
    photos: {
        type: [shopPhotosSchema],
        default:null
    },
}

const shopCategoriesSchema= {
    imageUri: String,
    title: String,
    snippet: String,
    shopCategoryID:String
}

const shopGallerySchema = {
    imageUri: String,
    shopGalleryID: String,
    dateUploaded:String,
    id:String
}
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
    image: String,
    dateCreated: String,
    rate: String,
    workers: {
        type: [shopWorkersSchema],
        default: null
    },
    photos: {
        type: [shopPhotosSchema],
        default:null
    },
    shopCategories:{
        type: [shopCategoriesSchema],
        default:null
    },
    gallery:{
        type: [shopGallerySchema],
        default:null
    }
};

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    phone: String,
    DOB: String,
    ID: String,
    about:{
        type: String,
        default: null
    },
    FullName:{
        type: String,
        default: null
    },
    website: {
        type: String,
        default: null
    },
    profileImage:{
        type: String,
        default: process.env.PFP
    },
    shop: {
        type: [shopSchema],
        default: null
    }
});

// userSchema.plugin(passportLocalMongoose);


const User = new mongoose.model("User", userSchema);
const Shop = new mongoose.model("Shop", shopSchema);
const ShopWorker = new mongoose.model("ShopWorker", shopWorkersSchema);
const ShopPhoto = new mongoose.model("ShopPhoto", shopPhotosSchema);
const ShopGallery = new mongoose.model("ShopGalley", shopGallerySchema);

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
                    username: _.upperFirst(username),
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
    let shops;
    Shop.find((err,found)=>{
        if(!err){
            if(found){
                shops=found;
            }else{
                res.status(402).send("No shop found");
            }
        }
    })
    User.findOne({ID:ID},(err,found)=>{
        if(err){
            res.status(400).send(err.message);
        }else{
            if(found){
                if(found.password== password){
                    
                    res.status(200).send({"found":found,"shops":shops});  
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
    let {email,category,shopName,region,city,landMark,businessNumber,discription,image,dateCreated} = req.body;
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
                                email:email,
                                ShopID:ID,
                                category: _.upperFirst(category),
                                shopName: _.upperFirst(shopName),
                                region: _.upperFirst(region),
                                city: _.upperFirst(city),
                                landMark: _.upperFirst(landMark),
                                businessNumber: businessNumber,
                                discription: discription,
                                image: image,
                                dateCreated:dateCreated,
                                rate:"1"
                            });
    
                            find.shop.push(shop);
                            find.save((err)=>{
                                if(!err){
                                    //Now update the client by adding the shop
                                    User.findOne({ID:ID},(err,client)=>{
                                                    if(!err){
                                                        shop.save();
                                                        res.status(200).send(client);
                                                    }else{
                                                        res.status(505).send();
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

app.post("/gallery",(req,res)=>{
    let {email,imageUri,dateUploaded,shopID} = req.body;
    const shopGalleryID = _.kebabCase(email);
    // console.log(1);
   Shop.findOne({_id:shopID},(err,find)=>{
    // console.log(2);
    if(!err){
        if(find){
            // console.log(3);
            
            // let id = find.gallery.length+1;
            const gallery = new ShopGallery({
                shopGalleryID:shopGalleryID,
                imageUri: imageUri,
                dateUploaded:dateUploaded,
                // id: id
            });
            find.gallery.push(gallery);
            find.save((err)=>{
                if(!err){
                    Shop.findOne({_id:shopID},(err,found)=>{
                        if(!err){
                            if(found){
                                res.status(200).send(found.gallery.reverse());
                            }
                        }
                    })
                }
            })
        }else{
            res.status(403).send("shop Not found");
        }
    }
   });
    
});

app.post("/deletegallery",(req,res)=>{
    let {galleryID,shopID}=req.body;
    
    Shop.findOneAndUpdate({_id: shopID},{ $pull: {gallery: {_id: galleryID}}}, (err,foundList)=>{
        if(!err){
            if(foundList){
                ///
                Shop.findOne({_id:shopID},(err,found)=>{
                    if(!err){
                        if(found){
                            res.status(200).send(found.gallery.reverse());
                        }
                    }
                })
                
                ///

            }else{
                res.status(404).send("Gallery does not exist!");
            }
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

app.get("/myshop/:shopID",(req,res)=>{
    const shopID = _.kebabCase(req.params.shopID);

    Shop.find({ShopID:shopID},(err,found)=>{
        if(!err){
            if(found){
                res.status(200).send(found.reverse()); 
            }else{
                res.status(404).send("Shop not found");
            }
        }else{
            res.status(505).send();
        }
    });
});

app.get("/user/:id", (req,res)=>{
    const id = req.params.id
    User.findOne({_id:id},(err,found)=>{
        if(!err){
            if(found){
                res.status(200).send(found);
            }else{
                res.status(404).send("No user Found");
            }
        }
    })
});

app.get("/shops",(req,res)=>{
    Shop.find((err,found)=>{
        if(!err){
            if(found){
                res.status(200).send(found);
            }else{
                res.status(402).send("No shop found");
            }
        }else{
            res.status(505).send(err);
        }
    })
});

app.get("/shop/:id",(req,res)=>{
    const id = req.params.id;
    Shop.findById(id,(err,found)=>{
        if(!err){
            if(found){
                res.status(200).send(found);
            }
        }
    })
});

app.post("/update_profile",(req,res)=>{
    let {id,fullName,username,website,about,phone,profileImage} = req.body;
    User.findByIdAndUpdate(id, {FullName:fullName,username:username,website:website,about:about,phone:phone,profileImage:profileImage},(err)=>{
        if(!err){
            User.findOne({id:id},(err,found)=>{
                if(!err){
                    if(found){
                        res.status(200).send(found);
                    }
                }
            })
            
        }else{
            res.status(505).send("Check your internet connnection and try again!");
        }
    });
});

app.post("/update_shopworker",(req,res)=>{
    
   let{idw,ids,email,name,age,number,category,about,address,imageUri} = req.body;

    Shop.updateOne({'workers._id': idw}, {'$set': {
        'workers.$.name': name,
        'workers.$.email': email,
        'workers.$.age': age,
        'workers.$.number': number,
        'workers.$.category': category,
        'workers.$.about': about,
        'workers.$.profileImage': imageUri,
        'workers.$.address': address,
    }},(err)=> {
        if(!err){
            Shop.findOne({_id:ids},(err,found)=>{
                if(!err){
                    if(found){
                        res.status(200).send(found.workers.reverse());
                    }
                }
            })
        }
    })

})

app.post("/editShop",(req,res)=>{
    let {id,email,businessNumber,category,city,about,imageURL,landMark,region,shopCategories,shopName} = req.body;
    Shop.findByIdAndUpdate(id,{
        email:email,
        category: category,
        shopName: shopName,
        region: region,
        city: city,
        landMark: landMark,
        businessNumber: businessNumber,
        discription: about,
        image: imageURL,
        shopCategories:shopCategories
    },(err)=>{
        if(!err){
            Shop.findById(id,(err,found)=>{
                if(!err){
                    if(found){
                        res.status(200).send(found);
                    }
                }
            })
        }else{
            res.status(505).send("Check your internet connnection and try again!");
        }
    });
});

app.post("/shopworker",(req,res)=>{
    let {name,age,number,category,about,address,profileImage,email,ShopID} = req.body;
    const workerID = _.kebabCase(email);
    Shop.findOne({_id:ShopID},(err,find)=>{
        if(!err){
            if(find){
                const worker = new ShopWorker({
                    WorkerID: workerID,
                    name: name,
                    age: age,
                    number: number,
                    rate: "1",
                    category: category,
                    about:about,
                    email:email,
                    address:address,
                    profileImage:profileImage
                });
                find.workers.push(worker);
                find.save((err)=>{
                    if(!err){
                        Shop.findOne({_id:ShopID},(err,found)=>{
                            if(!err){
                                if(found){
                                    res.status(200).send(found.workers.reverse());
                                }
                            }
                        })
                    }
                })
            }else{
                res.status(404).send("Shop does not exist!");
            }
        }
    })

});

// finding the workers of a particular shop
app.get("/shopworkers/:id",(req,res)=>{
    let ShopID = req.params.id
        Shop.findOne({_id:ShopID},(err,found)=>{
            if(!err){
                if(found){
                    res.status(200).send(found.workers.reverse());
                }
            }
        })
});


app.post("/deleteshopworker",(req,res)=>{
    let {workerID,shopID}=req.body;
    
    Shop.findOneAndUpdate({_id: shopID},{ $pull: {workers: {_id: workerID}}}, (err,foundList)=>{
        if(!err){
            if(foundList){
                ///
                Shop.findOne({_id:shopID},(err,found)=>{
                    if(!err){
                        if(found){
                            res.status(200).send(found.workers.reverse());
                        }
                    }
                })
                
                ///

            }else{
                res.status(404).send("Gallery does not exist!");
            }
        }
      });

});

app.post("/deleteshop",(req,res)=>{
    let {id,email,userID}=req.body;
    const shopID = _.kebabCase(email);
    User.findOneAndUpdate({_id: userID},{ $pull: {shop: {_id: id}}}, (err,foundList)=>{
        if(err){
        console.log(err);
        }
      });
    Shop.findByIdAndDelete(id,(err)=>{
        if(!err){
            
            Shop.find({ShopID:shopID},(err,found)=>{
                if(!err){
                    if(found){
                        res.status(200).send(found.reverse()); 
                    }else{
                        res.status(404).send("Shop not found");
                    }
                }else{
                    res.status(505).send();
                }
            });
        }
    })
})

app.post("/upload",upload.single("shopImage"),(req,res)=>{
    console.log(req.file);
    res.send("sent");
});











app.listen(process.env.PORT ||3000,()=>{
    console.log("Barber Shop Backend Is Running On Port 3000");
});