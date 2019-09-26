// Precondition: You need to require socket.io.js in your html page
// Reference link https://socket.io
// <script src="socket.io.js"></script>

$(document).ready(function() {
  // Connect to API App server
  let socket = io.connect(SERVER, {
    reconnect: true,
    transports: ["websocket"]
  });
  let timeout = null;
  let cacheSTEP = null;
  // LISTEN SOCKET.IO EVENTS

  // It it required to emit `join channel` event every time connection is happened
  socket.on(CONNECT, () => {
    document.getElementById("connected-status").innerHTML = "ON";
    document.getElementById("socket-status").innerHTML = "Connected";
    console.log("[Socket] connected to server");
    // API-1a
    socket.emit(JOIN_GAME, { game_id: GAME_ID, player_id: PLAYER_ID });
  });

  socket.on(DISCONNECT, () => {
    console.warn("[Socket] disconnected");
    document.getElementById("socket-status").innerHTML = "Disconnected";
    console.warn("[Socket] reconnect");
    socket = io.connect(SERVER, {
      reconnect: true,
      transports: ["websocket"]
    });
  });

  socket.on(CONNECT_FAIL, () => {
    console.warn("[Socket] connect_failed");
    document.getElementById("socket-status").innerHTML = "Connected Failed";
    console.warn("[Socket] reconnect");
    socket = io.connect(SERVER, {
      reconnect: true,
      transports: ["websocket"]
    });
  });

  socket.on(ERROR, err => {
    console.error("[Socket] error ", err);
    document.getElementById("socket-status").innerHTML = "Error!";
  });

  // SOCKET EVENTS

  // API-1b
  socket.on(JOIN_GAME, res => {
    console.log("[Socket] join-game responsed", res);
    document.getElementById("joingame-status").innerHTML = "ON";
  });

  //API-2
  socket.on(TICKTACK_PLAYER, res => {
    console.info("> ticktack");
    console.log("[Socket] ticktack-player responsed, map_info: ", res.map_info);
    document.getElementById("ticktack-status").innerHTML = "ON";
    if (cacheSTEP == null) {
      // getSolution(res.map_info);
    }
  });

  // API-3a
  // socket.emit('drive player', { direction: '111b333222' });

  //API-3b
  socket.on(DRIVE_PLAYER, res => {
    console.log("[Socket] drive-player responsed, res: ", res);
    if (res.player_id == PLAYER_ID && res.direction == cacheSTEP) {
      cacheSTEP = null;
    }
  });

  $("#up").click(function() {
    socket.emit(DRIVE_PLAYER, { direction: "3" });
  });
  $("#down").click(function() {
    socket.emit(DRIVE_PLAYER, { direction: "4" });
  });
  $("#left").click(function() {
    socket.emit(DRIVE_PLAYER, { direction: "1" });
  });
  $("#right").click(function() {
    socket.emit(DRIVE_PLAYER, { direction: "2" });
  });
  $("#boom").click(function() {
    socket.emit(DRIVE_PLAYER, { direction: "b" });
  });
  $(document).keyup(function(event) {
    // console.log(event.keyCode);
    switch (event.keyCode) {
      case 38:
        socket.emit(DRIVE_PLAYER, { direction: "3" });
        break;
      case 40:
        socket.emit(DRIVE_PLAYER, { direction: "4" });
        break;
      case 39:
        socket.emit(DRIVE_PLAYER, { direction: "2" });
        break;
      case 37:
        socket.emit(DRIVE_PLAYER, { direction: "1" });
        break;
      default:
        socket.emit(DRIVE_PLAYER, { direction: "b" });
        break;
    }
  });
  let _bfs = null;
  const getSolution = response => {
    let myId = response.myId;
    let map = response.map;
    let listBombs = response.bombs;
    let listSpoils = response.spoils;
    let rows = parseInt(response.size.rows);
    let cols = parseInt(response.size.cols);
    if (_bfs == null) {
      _bfs = new BreathFirstSearch(cols, rows);
    }
    let players = response.players;
    let myPlayer = players[PLAYER_ID];
    let killPlayer = null;
    // for (let i = 0; i < players.length; i++) {
    //   let player = players[i];
    //   if (player.id === PLAYER_ID) {
    //     myPlayer = player;
    //   } else {
    //     killPlayer = player;
    //   }
    // }
    let step = _bfs.findPath(
      {
        x: myPlayer.currentPosition.col,
        y: myPlayer.currentPosition.row
      },
      map,
      listBombs,
      myPlayer.power + 2,
      myPlayer.power + 2,
      listSpoils
    );
    console.log(`**********************STEP: ${step}*************************`);
    if (step != null) {
      if (_bfs.getMode() == STOP) {
        setTimeout(function() {
          socket.emit(DRIVE_PLAYER, { direction: step });
        }, 50);
      } else {
        socket.emit(DRIVE_PLAYER, { direction: step });
      }
      cacheSTEP = step;
    } else {
      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(function() {
        console.log(`START TIMEOUT!`);
        let cache = _bfs.getCacheValue();
        if (cache != null) {
          console.log(`cache: ${JSON.stringify(cache)}`);
          response.map[cache.y][cache.x] = BLANK;
        }
        response.bombs = [];
        getSolution(response);
      }, 4000);
    }
  };
});
