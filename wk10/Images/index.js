const multer = require('multer');
const express = require('express');
const app = express();
const path = require('path');
const util = require('util');
const fs = require('fs');
const https = require('https');
const bodyParser = require('body-parser');
const hb = require('express-handlebars');
app.engine('handlebars', hb({defaultLayout: 'layout'}));
app.set('view engine', 'handlebars');
const chalk = require('chalk');
var error = chalk.bold.magenta;
var property = chalk.cyan;

app.use(bodyParser.urlencoded({
    extended:false
}));
var diskStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function (req, file, callback) {
        callback(null, Date.now() + '_' + Math.floor(Math.random() * 99999999) + '_' + file.originalname);
    }
});
var uploader = multer({
    storage: diskStorage,
    limits: {
        filesize: 2097152
    }
});

var staticURL = path.join(__dirname, 'Static');
app.use(express.static(staticURL));
var staticURL2 = path.join(__dirname, 'uploads');
app.use(express.static(staticURL2));

app.get('/upload', function(req,res){
    res.render('upload');
});
app.post('/upload', uploader.single('file'), function(req, res) {
    if (req.file) {
        res.json({
            success: true,
            file: req.file.filename
        });
    } else {
        res.json({
            success: false
        });
    }
});

app.get('/getimg', function(req,res){
    res.render('getimg');
});
app.post('/getimg', function(req,res){
    var url = req.body.imgurl;
    var file = fs.createWriteStream('./uploads/img.png');
    function getImage(url){
        return new Promise(function(resolve,reject){
            file.on('open', function(){
                https.get(url, function(headRes){
                    console.log(util.inspect(url, {showHidden: false, depth: null}));
                    var maxSize = 2097152;
                    var size = headRes.headers['content-length'];
                    if (size > maxSize) {
                        console.log('Resource size exceeds limit (' + size + ')');
                        reject('Resource size exceeds limit (' + size + ')');
                    } else {
                        console.log("well...");
                        headRes.pipe(file);
                        file.on('finish', function(){
                            file.close();
                            resolve();
                        }).on('error', function(err){
                            console.log(err);
                            reject(err);
                        });
                    }
                }).on('error', function(err){
                    console.log(err);
                    reject(err);
                });
            });
        });
    }
    getImage(url).then(function(){
        console.log('Success');
        res.render('getimg', {
            'img': 'img.png'
        });
    }).catch(function(err){
        console.log("Caught");
        res.render('getimg', {
            'err': err
        });
    });
});

app.listen(8080, console.log('Listening on port 8080'));
