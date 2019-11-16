"use strict";

function Node(
  x,
  y,
  value = BLANK,
  previous = null,
  remainTime = -1,
  spoil_type = -1,
  playerId = -1
) {
  this.x = x;
  this.y = y;
  this.value = value;
  this.remainTime = remainTime;
  this.spoil_type = spoil_type;
  this.previous = previous;
  this.playerId = playerId;
}

function BreathFirstSearch(cols, rows) {
  let open = new Queue();
  // let cachePoint = null;
  let cacheValue = null;
  let mode = MODE_START;
  let solution = [];
  let listBombUpdate = [];
  let mydelay1 = 2000;
  let killdelay1 = 2000;
  let mySpeed = 100;
  let killPlayer = {};
  let checkSpaceStone = false;
  let isBreakSpaceStone = false;
  let lastStep = "";
  // let checkMyBombExist = false;
  let nodes = [];
  // convert the integer array (walls) to node array
  for (let i = 0; i < rows; i++) {
    nodes[i] = [];
    for (let j = 0; j < cols; j++) {
      nodes[i][j] = new Node(j, i);
    }
  }
  this.getCheckSpaceStone = function() {
    return checkSpaceStone;
  };
  this.resetDefault = function() {
    cacheValue = null;
    mode = MODE_START;
    solution = [];
    listBombUpdate = [];
    mydelay1 = 2000;
    killdelay1 = 2000;
    mySpeed = 100;
    killPlayer = {};
    checkSpaceStone = false;
    isBreakSpaceStone = false;
  };
  this.setMySpeed = function(value) {
    mySpeed = value;
  };
  this.setKillPlayer = function(value) {
    killPlayer = value;
  };
  this.setIsBreakSpaceStone = function(value) {
    isBreakSpaceStone = value;
  };
  // this.addItemListBomb = function(bomb) {
  //   listmyBomb.push(bomb);
  // };
  // this.removeItemListBomb = function(bomb) {
  //   for (var i = 0; i < listmyBomb.length; i++) {
  //     if (listmyBomb[i].row === bomb.row && listmyBomb[i].col === bomb.col) {
  //       listmyBomb.splice(i, 1);
  //     }
  //   }
  // };
  // this.getListMyBomb = function() {
  //   return listmyBomb;
  // };
  this.getSolution = function() {
    return solution;
  };
  this.getMode = function() {
    return mode;
  };
  this.setMode = function(value) {
    mode = value;
  };
  this.getCacheValue = function() {
    return cacheValue;
  };
  this.updateMap = function(map, listBombMap, myPower, killPower, listSpoils) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        nodes[i][j].value = map[i][j];
        nodes[i][j].previous = undefined;
        nodes[i][j].remainTime = -1;
        nodes[i][j].spoil_type = -1;
      }
    }
    this.updateMapItem(listSpoils);
    //set toạ độ kill player
    nodes[killPlayer.y][killPlayer.x].value = VALUE;
    nodes[killPlayer.y][killPlayer.x].remainTime = -1;
    nodes[killPlayer.y][killPlayer.x].spoil_type = -1;
    nodes[killPlayer.y][killPlayer.x].previous = undefined;

    this.updateMapBooms(listBombMap, myPower, killPower);
  };
  this.updateMapItem = function(listSpoils) {
    console.log(`[${mode}][updateMapItem] listSpoils: `, listSpoils);
    let size = listSpoils.length;
    for (let i = 0; i < size; i++) {
      let spoils = listSpoils[i];
      if ((mySpeed <= MIN_SPEED && spoils.spoil_type === MIND_STONE) || (isBreakSpaceStone && spoils.spoil_type === SPACE_STONE)) {
        console.log(`%c [VN] không ăn${spoils.spoil_type === MIND_STONE?' giảm speed ':' space stone '} nữa`, STYLE_LOG);
        //không giam speed nữa
        let x = spoils.col;
        let y = spoils.row;
        console.log(`x: ${x} y: ${y}`);
        nodes[y][x].value = VISITED;
        nodes[y][x].spoil_type = spoils.spoil_type;
      } else {
        let x = spoils.col;
        let y = spoils.row;
        nodes[y][x].value = ITEM;
        nodes[y][x].spoil_type = spoils.spoil_type;
      }
    }
    // nodes[cacheValue.y][cacheValue.x].value = ITEM;
  };
  this.updateMapBooms = function(listBombMap, myPower, killPower) {
    console.log(`[${mode}][updateMapBooms] listBombMap: `, listBombMap);
    listBombUpdate = [];
    let size = listBombMap.length;
    for (let i = 0; i < size; i++) {
      let bomb = listBombMap[i];
      listBombUpdate.push(bomb);
      if (bomb.playerId === PLAYER_ID) {
        // checkMyBombExist = true;
        listBombUpdate.push(...this.getMapBomb(bomb, myPower));
      } else {
        listBombUpdate.push(...this.getMapBomb(bomb, killPower));
      }
    }
    // if (!checkMyBombExist && listmyBomb.length > 0 && mode === DONE_BOMB) {
    //   listBombUpdate.push(listmyBomb[0]);
    //   listBombUpdate.push(...this.getMapBomb(listmyBomb[0], myPower));
    // }
    let len = listBombUpdate.length;
    console.log(`[${mode}][updateMapBooms] listBombUpdate: `, listBombUpdate);
    for (let j = 0; j < len; j++) {
      let x = listBombUpdate[j].col;
      let y = listBombUpdate[j].row;
      if (nodes[y][x].value === BLANK || nodes[y][x].value === ITEM) {
        nodes[y][x].value = BOMBB;
        nodes[y][x].remainTime = listBombUpdate[j].remainTime;
        nodes[y][x].playerId = listBombUpdate[j].playerId;
      } else if (nodes[y][x].value === VALUE) {
        nodes[y][x].value = VISITED;
      }
    }
  };
  this.getMapBomb = function(bomb, myPower) {
    let result = [];
    let x = bomb.col;
    let y = bomb.row;
    let remainTime = bomb.remainTime;
    let playerId = bomb.playerId;
    for (let i = 1; i <= myPower; i++) {
      if (x + i < cols - 1) {
        result.push({
          row: y,
          col: x + i,
          remainTime: remainTime,
          playerId: playerId
        }); // x++
      }
      if (x - i > 0) {
        result.push({
          row: y,
          col: x - i,
          remainTime: remainTime,
          playerId: playerId
        }); // x--
      }
      if (y + i < rows - 1) {
        result.push({
          row: y + i,
          col: x,
          remainTime: remainTime,
          playerId: playerId
        }); // y++
      }
      if (y - i > 0) {
        result.push({
          row: y - i,
          col: x,
          remainTime: remainTime,
          playerId: playerId
        }); // y--
      }
    }
    return result;
  };
  this.isSpoilsMin = function(start, listSpoils) {
    for (let i = 0; i < listSpoils.length; i++) {
      let spoils = listSpoils[i];
      let d = Math.sqrt(
        Math.pow(spoils.row - start.y) + Math.pow(spoils.col - start.x)
      );
      if (d <= 3) {
        return true;
      }
    }
    return false;
  };
  this.findPath = function(
    start,
    map,
    listBombMap,
    myPower,
    killPower,
    listSpoils,
    mydelay,
    killdelay
  ) {
    mydelay1 = mydelay;
    killdelay1 = killdelay;
    checkSpaceStone = false;
    let node;
    if (open) {
      open.clear();
    } else {
      open = new Queue();
    }
    this.updateMap(map, listBombMap, myPower, killPower, listSpoils);
    console.log(`[${mode}][findPath] nodes: `, nodes);
    // add the start node to queue
    open.enqueue(start);
    // the main loop
    while (!open.isEmpty()) {
      node = open.dequeue();
      if (node) {
        if (node.value === mode) {
          solution = getSolution(node);
          let listStep = getString(start, solution);
          if (mode === MODE_RUN_VALUE) {
            console.log(`[${mode}][findPath] DONE_VALUE`);
            if (listStep.length <= 1) {
              listStep = "";
            } else {
              listStep = `${listStep.substr(0, listStep.length - 1)}`;
            }
          }
          lastStep = listStep.substr(listStep.length - 1);
          return listStep;
        }
        genMove(node);
      } else {
        break;
      }
    }
    return null;
  };

  // generate next states by adding neighbour nodes
  function genMove(node) {
    if (node.x < cols - 1) {
      addToOpen(node.x + 1, node.y, node);
    }
    if (node.y < rows - 1) {
      addToOpen(node.x, node.y + 1, node);
    }
    if (node.x > 0) {
      addToOpen(node.x - 1, node.y, node);
    }
    if (node.y > 0) {
      addToOpen(node.x, node.y - 1, node);
    }
  }

  function addToOpen(x, y, previous) {
    let node = nodes[y][x];

    if (node.value === BLANK) {
      if (mode === MODE_RUN_BOMB) {
        node.value = DONE_BOMB;
      } else {
        node.value = VISITED;
      }
      // store the previous node
      // so that we can backtrack to find the optimum path
      // (by using the getSolution() method)
      node.previous = previous;
      open.enqueue(node);
    } else if (node.value === BOMBB) {
      // console.log(`bomb: `,JSON.stringify(node));
      let step = getCountStep(previous) + 1;
      console.log(`step: `, step);
      if (
        node.playerId === PLAYER_ID &&
        (node.remainTime - (step * TIME_MILLISECOND_STEP)) >= 200
      ) {
        console.log("VISITED");
        node.value = VISITED;
        node.previous = previous;
        open.enqueue(node);
      } else if (
        node.playerId != PLAYER_ID &&
        (node.remainTime - (step * TIME_MILLISECOND_STEP)) >= 400
      ) {
        console.log("VISITED");
        node.value = VISITED;
        node.previous = previous;
        open.enqueue(node);
      }
    } else if (node.value === ITEM) {
      // mark this node as visited to avoid adding it multiple times
      // if (mySpeed <= MIN_SPEED && node.spoil_type === MIND_STONE) {
      //     //không giam speed nữa 
      // }else{
          node.value = DONE_ITEM;
          node.previous = previous;
          open.enqueue(node);
      // }
    } else if (node.value === VALUE && mode === MODE_RUN_VALUE) {
      // mark this node as visited to avoid adding it multiple times
      let is = isBomb(previous.x, previous.y);
      if (!is) {
        node.value = DONE_VALUE;
        node.previous = previous;
        open.enqueue(node);
      }
    }
  }
  function isBomb(x, y) {
    let size = listBombUpdate.length;
    for (let i = 0; i < size; i++) {
      let bomb = listBombUpdate[i];
      if (bomb.row === y && bomb.col === x) {
        return true;
      }
    }
    return false;
  }
  function getCountStep(node) {
    let num = 0;
    if (node.previous){
      num++;
      num+= getCountStep(node.previous);
    } else{
      return 0;
    }
    return num;
  }
  function getTimeBomb(x, y) {
    let size = listBombUpdate.length;
    for (let i = 0; i < size; i++) {
      let bomb = listBombUpdate[i];
      if (bomb.row === y && bomb.col === x) {
        return bomb.remainTime;
      }
    }
    return -1;
  }
  function getSolution(p) {
    let nodes = [];
    nodes.push(p);
    while (p.previous) {
      if (p.spoil_type === SPACE_STONE) {
        console.log(`%c [VN] Đi Qua SPACE_STONE`, STYLE_LOG);
        checkSpaceStone = true;
      }
      nodes.push(p.previous);
      p = p.previous;
    }
    return nodes;
  }

  function getString(start, path) {
    let x = start.x;
    let y = start.y;
    let _string = "";
    if (path) {
      for (let i = path.length - 1; i >= 0; i--) {
        let newPos = path[i];
        if (newPos.x < x) {
          _string += `${LEFT}`;
          x--;
        } else if (newPos.x > x) {
          _string += `${RIGHT}`;
          x++;
        } else if (newPos.y < y) {
          _string += `${UP}`;
          y--;
        } else if (newPos.y > y) {
          _string += `${DOWN}`;
          y++;
        }
      }
      return _string;
    }
    return null;
  }
}
