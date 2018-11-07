//openweathermap.js
require('date-utils');
const http = require('http');
const Bleacon = require('bleacon');
const uuid = '0000000007ae1001b000001c4d8dfe8b';
const major = 1; // 0 - 65535
const minor = 3; // 0 - 65535
const location = 'Ginowan,JP';
const units = 'metric';
const apikey = 'a60ea32451cc03c8375c5b4e77f4eb34';
var url = 'http://api.openweathermap.org/data/2.5/weather?q='+location+'&units='+units+'&appid='+apikey;

//データベースの設定
var mysql = require("mysql");
var db_name = "beacon";
var db = mysql.createConnection({
    user:"root",
    password:"vEpi9wNp",
    database:db_name
});

//データベースに接続
db.connect(function(err){
    if (err) {
        console.log(err);
    }else{
        console.log("database connected");
    }
});

//気象データを取ってくる関数
function GetWeather(callback){
    http.get(url,function(res){
    var body = '';
    res.setEncoding('utf8');
    res.on('data',function(chunk){
      body += chunk;
      data = JSON.parse(body);
      callback(data);
    });
    }).on('error', function(e) {
        console.log(e.message);
    });
}

//apiから取ってきたデータを保管するコールバック関数
var Getdata = function(data){
    console.log(data);
}

//アドバタイズされている信号をスキャン(Beacon)
function Startscan(){
    //Bleacon.startScanning([uuid], [major], [minor]);
    Bleacon.startScanning([uuid]);
    console.log("Start scan")
}

//スキャンを停止する
function Stopscan(){
    Bleacon.stopScanning();
    console.log("Stop scan")
}

//データベースに格納
function insert_db(Uuid,Major,Minor,Txpower,Rssi,Accuracy,Proximity,device_name,timestamp){
    db.query("insert into dataset1(UUIDs,Major,Minor,Accuracy,Proximity,TxPower,RSSI,device_name,timestamp) values(?,?,?,?,?,?,?,?,?)",[Uuid,Major,Minor,Accuracy,Proximity,Txpower,Rssi,device_name,timestamp],function(error,results,fields){
        console.log(error);
        console.log(results);
        console.log(fields);
    })
}

//ビーコンが見つかった時呼びだし
Bleacon.on('discover', function(bleacon) {
    timestamp = new Date().toFormat('YYYY/MM/DD HH24:MI:SS');
    Uuid = bleacon["uuid"];
    Major = bleacon["major"];
    Minor = bleacon["minor"];
    Txpower = bleacon["measuredPower"];
    Rssi = bleacon["rssi"];
    Accuracy = bleacon["accuracy"];
    Proximity = bleacon["proximity"];
    device_name = 'rasp1'
    insert_db(Uuid,Major,Minor,Txpower,Rssi,Accuracy,Proximity,device_name,timestamp);
});

Startscan();
//GetWeather(Getdata);
