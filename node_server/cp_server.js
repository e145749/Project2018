/*socketサーバー*/
var insert_data = [ ];
var user = [ ];

// 現在時刻を取得するメソッドを定義
require('date-utils');
sleep = require('sleep');
// サーバー設定
var http = require("http");
var server = http.createServer(function(req,res) {
	res.write("Connection start");
	res.end();
});

// socket.ioの準備
var io = require("socket.io")(server);
console.log("SocketServer Working");

var mysql = require("mysql");
var db_name = "beacon";
var db = mysql.createConnection({
    user:"root",
    password:"0302a",
    database:db_name
});

// データベースに接続
db.connect(function(err){
    if (err) {
        console.log(err);
    }else{
        console.log("success");
    }
});

// クライアント接続時の処理
io.on("connect", function(socket) {
    
    // ユーザー情報の登録
    socket.on("user_name",function(name){
        console.log("user(" + name + ")" + " connected!!");
        // 登録されていないユーザーなら保存
        if(user[socket.id] != name){
            user[socket.id] = name;
            console.log(user[socket.id]);
        }   
    })

    // クライアント切断時の処理
    socket.on("disconnect", function() {
        console.log("user(" + user[socket.id] + ")" + " disconnected!!");
        delete user[socket.id];
    });
    
    // スキャン状態を表示
    socket.on("scan state",function(bool){
        if(bool == true){
            console.log("user(" + user[socket.id] + ")" + " start scan");
        }else{
            console.log("user(" + user[socket.id] + ")" + " stop scan")
        }
    });
  
	// ビーコンデータを受信
	socket.on("emit_beacondata",function(data) {
        if(data != null){
            console.log(data);
            // データベースへの書き込み
            //insert_query(data);
        }else{
            console.log("data is empty");
        }
	});

    // 受信機にてビーコン発見時
    socket.on("lab_name",function(data){
        console.log(data);
        io.sockets.emit("lab_name",data);
    });

    // 5分ごとに全てのクライアントに定期実行させる
    /*
    setInterval( function() {
        // 送信した時刻を表示
        var dt = new Date();
        var formatted = dt.toFormat("送信要求 YYYY/MM/DD HH24時MI分SS秒");
        console.log(formatted);
        // 接続している全ての端末にデータ送信要求を行う
        // io.sockets.emit("regular_run",formatted);
        io.sockets.emit("regular_run",formatted); 
    }, 60000*10);
    */
});

// データベースに格納
function insert_query(data){
    // query文でデータベースに代入するために一時的に配列に格納
    var values = [data[0],data[1],data[2],data[3],data[4],data[5],data[6],data[7],data[8],data[9],data[10],data[11],data[12],data[13]];
    // データベースに取得したデータを格納
    db.query("insert into beacondata(Periferal,UUIDs,RSSI,Latitude,Longitude,temp,pressure,weather,weatherDescription,clouds,windspeed,winddeg,timestanp,device_name) values(?)",[values],function(error,results,fields){
        console.log(error);
        console.log(results);
        console.log(fields);
    })
    // 各配列を初期化
    values = [ ];
    data = [ ];   
}

server.listen(8000,"10.0.3.86");
