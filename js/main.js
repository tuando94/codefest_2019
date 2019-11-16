"use strict";
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
    if (cacheSTEP == null && res.map_info != null) {
      getSolution(res.map_info);
    }else{
      console.log(`%c [VN] map_info = null or cacheSTEP != null`, STYLE_LOG);
      // socket.emit(DRIVE_PLAYER, { direction: tuan });
    }
  });
  let tuan = "";
  // API-3a
  // socket.emit('drive player', { direction: '111b333222' });

  //API-3b
  socket.on(DRIVE_PLAYER, res => {
    console.log("[Socket] drive-player responsed, res: ", res);
    tuan = cacheSTEP;
    if (res.player_id === PLAYER_ID && res.direction === cacheSTEP) {
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
      case 32:
        socket.emit(DRIVE_PLAYER, { direction: "b" });
        break;
    }
  });
  let _bfs = null;
  let cachePoint = null;
  let checkSpaceStone = false;
  let checkBombAni = false;
  let isBreakSpaceStone = false;
  let myPower = 1;
  let mySpeed = 100;
  let killPower = 1;
  let mydelay= 2000;
  let killdelay = 2000;
  let mySpawnBegin = { col: 1, row: 16 };
  const getSolution = response => {
    console.log(`response: `, response);
    //get ID
    let myId = response.myId;
    //get map
    let map = response.map;
    //get list boom
    let listBombs = response.bombs;
    //get list vật phẩm
    let listSpoils = response.spoils;
    //check tồn tại _bfs
    if (_bfs == null) {
      let rows = parseInt(response.size.rows);
      let cols = parseInt(response.size.cols);
      _bfs = new BreathFirstSearch(cols, rows);
    }
    //get list player
    let players = response.players;

    let myPlayer = null;
    let killPlayer = null;
    for (let i = 0; i < players.length; i++) {
      if (players[i].id === PLAYER_ID) {
        myPlayer = players[i];
      } else {
        killPlayer = players[i];
      }
    }
    if (myId === PLAYER_ID) {
      //request của myPlayer
      mySpeed = myPlayer.speed;
      myPower = myPlayer.power;
      mydelay = myPlayer.delay;
      mySpawnBegin = myPlayer.spawnBegin;

      clearTimeout(timeout);
      timeout = null;
      timeout = setTimeout(function() {
        console.log(`START TIMEOUT!`);
        //reset
        cachePoint = null;
        _bfs.setMode(MODE_RUN_ITEM_SUCCESS);
        clearTimeout(timeout);
      }, TIME_DELAY_REQUEST);
    } else {
      //request của killPlayer
      killPower = killPlayer.power;
      killdelay = myPlayer.delay;
    }
    isBreakSpaceStone = checkBreakSpaceStone(listBombs);
    _bfs.setMySpeed(mySpeed);
    _bfs.setIsBreakSpaceStone(isBreakSpaceStone);
    let start = {
      x: myPlayer.currentPosition.col,
      y: myPlayer.currentPosition.row
    };
    _bfs.setKillPlayer({
      x: killPlayer.currentPosition.col,
      y: killPlayer.currentPosition.row
    });

    //logic
    checkBombAni = false;
    let step = "";
    let mode = _bfs.getMode();
    if (!checkCache(start)) {
      return;
    }
    if (mode === MODE_START) {
      // //Tìm đường đi đến thùng gần nhất
      step = searchViTriGanNhat(
        start,
        map,
        listBombs,
        myPower,
        killPower,
        listSpoils,
        mydelay,
        killdelay
      );
    } else if (mode === MODE_RUN_BOMB) {
      if (checkExitMyBomb(listBombs)) {
        console.log(`%c [VN] đã đặt boom xong, đi tiếp`, STYLE_LOG);
        //Tìm đường đi ăn item
        step = searchDuongAnItem(
          start,
          map,
          listBombs,
          myPower,
          killPower,
          listSpoils,
          mydelay,
          killdelay
        );
      } else {
        console.log(`%c [VN] chưa đặt boom xong`, STYLE_LOG);
        _bfs.setMode(MODE_RUN_BOMB);
        return;
      }
    } else if (mode === MODE_RUN_ITEM_SUCCESS) {
      if (!checkExitMyBomb(listBombs)) {
        console.log(`%c [VN] Đang ở vị trí item, bomb đã nổ`, STYLE_LOG);
        checkBombAni = true;
        step = searchViTriGanNhat(
          start,
          map,
          listBombs,
          myPower,
          killPower,
          listSpoils,
          mydelay,
          killdelay
        );
      } else {
        console.log(`%c [VN] Đang ở vị trí item, bomb chưa nổ`, STYLE_LOG);
        step = searchDuongAnItem(
          start,
          map,
          listBombs,
          myPower,
          killPower,
          listSpoils,
          mydelay,
          killdelay
        );
      }
    } else if (mode === MODE_RUN_VALUE_SUCCESS) {
      if (!checkExitMyBomb(listBombs)) {
        console.log(`%c [VN] Đang ở vị trí vật phẩm, bomb đã nổ`, STYLE_LOG);
        checkBombAni = true;
        step = BOMB;
        cachePoint = start;
        _bfs.setMode(MODE_RUN_BOMB);
      }else {
        console.log(`%c [VN] Đang ở vị trí vật phẩm,  bomb chưa nổ`, STYLE_LOG);
        _bfs.setMode(MODE_RUN_VALUE_SUCCESS);
        return;
      }
    } else if (mode === MODE_RUN_BOMB_SUCCESS) {
      if (!checkExitMyBomb(listBombs)) {
        console.log(`%c [VN] Đang ở vị trí né bomb, bomb đã nổ`, STYLE_LOG);
        checkBombAni = true;
        step = searchViTriGanNhat(
          start,
          map,
          listBombs,
          myPower,
          killPower,
          listSpoils,
          mydelay,
          killdelay
        );
      } else {
        console.log(
          `%c [VN] Đang ở vị trí né bomb,  bomb chưa nổ`,
          STYLE_LOG
        );
         _bfs.setMode(MODE_RUN_BOMB_SUCCESS);
         return;
      }
    }
    console.log(
      `%c STEP: ${step}`,
      "background: #ff0000; color:#ffffff ; font-size:13px;"
    );
    if (step != null && step.length >0) {
      // if (_bfs.getMode() === STOP) {
      //   setTimeout(function() {
      //     socket.emit(DRIVE_PLAYER, { direction: step });
      //   }, 100);
      // } else
       if (checkBombAni) {
         setTimeout(function() {
           socket.emit(DRIVE_PLAYER, { direction: step });
         }, TIME_ANIMATION_BOMB);
      //  } else if (checkSpaceStone) {
      //    setTimeout(function() {
      //      socket.emit(DRIVE_PLAYER, { direction: step });
      //    }, TIME_ANIMATION_SPACESTONE);
       } else {
        //  setTimeout(function() {
        //    socket.emit(DRIVE_PLAYER, { direction: step });
        //  }, 100);
         socket.emit(DRIVE_PLAYER, { direction: step });
       }
      cacheSTEP = step;
    } else {
      // clearTimeout(timeout);
      // timeout = null;
      // timeout = setTimeout(function() {
      //   console.log(`START TIMEOUT!`);
      //   let cache = _bfs.getCacheValue();
      //   if (cache != null) {
      //     console.log(`cache: ${JSON.stringify(cache)}`);
      //     response.map[cache.y][cache.x] = BLANK;
      //   }
      //   response.bombs = [];
      //   getSolution(response);
      // }, TIME_BOMB);
    }
  };

  const checkCache = (start) => {
    console.log("checkCache");
    checkSpaceStone = _bfs.getCheckSpaceStone();
    console.log(`%c SpaceStone ${checkSpaceStone}`, STYLE_LOG);

    if (
      cachePoint != null &&
      (cachePoint.x !== start.x || cachePoint.y !== start.y)
    ) {
      if (
        ((start.x === 1 && start.y === 1) ||
          (start.x === 26 && start.y === 1) ||
          (start.x === 1 && start.y === 16) ||
          (start.x === 26 && start.y === 16)) &&
          _bfs.getCheckSpaceStone()
      ) {
        // checkSpaceStone = true;
        console.log("%c next step SpaceStone", STYLE_LOG);
        _bfs.setMode(MODE_RUN_ITEM_SUCCESS);
        //next step
        return true;
      } else {
        console.log(`[checkCache]cachePoint: ${JSON.stringify(cachePoint)}`);
        console.log("%c break step", STYLE_LOG);
        //break step
        return false;
      }
    } else {
      if (_bfs.getCheckSpaceStone()){
        if (((start.x === 1 && start.y === 1) ||
              (start.x === 26 && start.y === 1) ||
              (start.x === 1 && start.y === 16) ||
              (start.x === 26 && start.y === 16))
          ) {
            // checkSpaceStone = true;
            console.log("%c next step SpaceStone", STYLE_LOG);
            _bfs.setMode(MODE_RUN_ITEM_SUCCESS);
            //next step
            return true;
          } else {
            console.log(`[checkCache]cachePoint: ${JSON.stringify(cachePoint)}`);
            console.log("%c break step", STYLE_LOG);
            //break step
            return false;
          }
      }else{
        // checkSpaceStone = false;
        console.log("%c next step", STYLE_LOG);
       //next step
        return true;
      }
    }
  };

  const checkExitMyBomb = (listBombs) => {
    let size = listBombs.length;
    // let listmyBomb = _bfs.getListMyBomb();
    console.log("listBombs: ", listBombs);
    for (let i = 0; i < size; i++) {
      let bomb = listBombs[i];
      if (bomb.playerId === PLAYER_ID) {
        return true;
      }
    }
    // if (isRemove) {
    //   console.log("remove bomb: ", listmyBomb[0]);
    //   _bfs.removeItemListBomb(listmyBomb[0]);
    // }
    return false;
  };
  // const isMyBomb = function(bomb, listmyBomb) {
  //   let size = listmyBomb.length;
  //   for (let i = 0; i < size; i++) {
  //     let myBomb = listmyBomb[i];
  //     if (myBomb.row === bomb.row && myBomb.col === bomb.col) {
  //       return true;
  //     }
  //   }
  //   return false;
  // };
  const isSpoilsMin = function(start, listSpoils, listBombs) {
    for (let i = 0; i < listSpoils.length; i++) {
      let spoils = listSpoils[i];
      if (!(mySpeed <= MIN_SPEED && spoils.spoil_type === MIND_STONE) || !(isBreakSpaceStone && spoils.spoil_type === SPACE_STONE)) {
        let d = Math.sqrt(
          Math.pow(spoils.row - start.y, 2) + Math.pow(spoils.col - start.x, 2)
        );
        if (d <= 5) {
          console.log(`%c [VN] Có item ở gần`, STYLE_LOG);
          return true;
        }
      }
    }
    console.log(`%c [VN] không có item ở gần`, STYLE_LOG);
    return false;
  };
  const checkBreakSpaceStone = function(listBombs) {
    for (let i = 0; i < listBombs.length; i++) {
      let bomb = listBombs[i];
      let power = bomb.playerId == PLAYER_ID ? myPower : killPower;
      if (
        (bomb.row === mySpawnBegin.row &&
          Math.abs(bomb.col - mySpawnBegin.col) <= power) ||
        (bomb.col === mySpawnBegin.col &&
          Math.abs(bomb.row - mySpawnBegin.row) <= power)
      ) {
        return true;
      }
    }
    return false;
  };
  const searchViTriGanNhat = function(
    start,
    map,
    listBombs,
    myPower,
    killPower,
    listSpoils,
    mydelay,
    killdelay
  ) {
    console.log(`%c [VN] Tìm đường đi đến thùng gần nhất`, STYLE_LOG);
    //Tìm đường đi đến thùng gần nhất
    _bfs.setMode(MODE_RUN_VALUE);
    let step = _bfs.findPath(
      start,
      map,
      listBombs,
      myPower,
      killPower,
      listSpoils,
      mydelay,
      killdelay
    );
    let solution = _bfs.getSolution();
    cachePoint = {
      x: solution[1].x,
      y: solution[1].y
    };
    console.log(`cachePoint: ${JSON.stringify(cachePoint)}`);
    step += BOMB;
    _bfs.setMode(MODE_RUN_BOMB);
    return step;
  };

  const searchDuongDiAnVatPham = function(
    start,
    map,
    listBombs,
    myPower,
    killPower,
    listSpoils,
    mydelay,
    killdelay
  ) {
    console.log(`%c [VN] Tìm đường đi ăn vật phẩm`, STYLE_LOG);
    //Tìm đường đi ăn vật phẩm
    _bfs.setMode(MODE_RUN_VALUE);
    let step = _bfs.findPath(
      start,
      map,
      listBombs,
      myPower,
      killPower,
      listSpoils,
      mydelay,
      killdelay
    );
    if (step == null) {
      console.log(`%c [VN] không có đường đi đến vật phẩm`, STYLE_LOG);
      console.log(`%c [VN] Tìm đường đi né bomb`, STYLE_LOG);
      //không có đường đi đến vật phẩm
      //Tìm đường đi né bomb
      _bfs.setMode(MODE_RUN_BOMB);
      step = _bfs.findPath(
        start,
        map,
        listBombs,
        myPower,
        killPower,
        listSpoils,
        mydelay,
        killdelay
      );
      _bfs.setMode(MODE_RUN_BOMB_SUCCESS);
      let solution = _bfs.getSolution();
      cachePoint = {
        x: solution[0].x,
        y: solution[0].y
      };
    } else {
      console.log(`%c [VN] có đường đi đến vật phẩm`, STYLE_LOG);
      //có đường đi đến vật phẩm
      _bfs.setMode(MODE_RUN_VALUE_SUCCESS);
      let solution = _bfs.getSolution();
      cachePoint = {
        x: solution[1].x,
        y: solution[1].y
      };
    }
    return step;
  };

  const searchDuongAnItem = function(
    start,
    map,
    listBombs,
    myPower,
    killPower,
    listSpoils,
    mydelay,
    killdelay
  ) {
    console.log(`%c [VN] Tìm đường đi ăn item`, STYLE_LOG);
    let step = "";
    //Tìm đường đi ăn item
    //check có vật phẩm ở gần phạm vị trí 5x5 ô
    if (listSpoils.length > 0 && isSpoilsMin(start, listSpoils, listBombs)) {
      //có vật phẩm ở gần phạm vị trí 5x5 ô
      _bfs.setMode(MODE_RUN_ITEM);
      step = _bfs.findPath(
        start,
        map,
        listBombs,
        myPower,
        killPower,
        listSpoils,
        mydelay,
        killdelay
      );

      if (step == null) {
        console.log(`%c [VN] Không có đường đi ăn item`, STYLE_LOG);
        step = searchDuongDiAnVatPham(
          start,
          map,
          listBombs,
          myPower,
          killPower,
          listSpoils,
          mydelay,
          killdelay
        );
      } else {
        console.log(`%c [VN] có đường đi đến ăn item`, STYLE_LOG);
        //có đường đi đến ăn item
        _bfs.setMode(MODE_RUN_ITEM_SUCCESS);
        let solution = _bfs.getSolution();
        cachePoint = {
          x: solution[0].x,
          y: solution[0].y
        };
      }
    } else {
      //không có vật phẩm ở gần phạm vị trí 5x5 ô
      step = searchDuongDiAnVatPham(
        start,
        map,
        listBombs,
        myPower,
        killPower,
        listSpoils,
        mydelay,
        killdelay
      );
    }
    return step;
  };
});
