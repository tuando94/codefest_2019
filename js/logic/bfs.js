function Node(
  x,
  y,
  value = BLANK,
  previous = null,
  remainTime = -1,
  spoilType = -1
) {
  this.x = x;
  this.y = y;
  this.value = value;
  this.remainTime = remainTime;
  this.spoilType = spoilType;
  this.previous = previous;
}
function BreathFirstSearch(cols, rows) {
  let open = new Queue();
  let cachePoint = null;
  let cacheValue = null;
  let mode = DONE_VALUE;
  let listmyBomb = [];
  let listmyItem = [];
  let lastStep = "";
  let checkMyBombExist = false;
  let nodes = [];
  // convert the integer array (walls) to node array
  for (let i = 0; i < rows; i++) {
    nodes[i] = [];
    for (let j = 0; j < cols; j++) {
      nodes[i][j] = new Node(j, i);
    }
  }
  this.getMode = function (){
    return mode;
  }
  this.getCacheValue = function(){
    return cacheValue;
  };
  this.updateMap = function(map, listBombMap, myPower, killPower, listSpoils) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        nodes[i][j].value = map[i][j];
      }
    }
    this.updateMapBooms(listBombMap, myPower, killPower);
    // this.updateMapItem(listSpoils);
  };
  this.updateMapItem = function(listSpoils) {
    console.log(`[${mode}][updateMapItem] listSpoils: `, listSpoils);
    for (let key in listSpoils) {
      if (listSpoils.hasOwnProperty(key)) {
        console.log(key + " -> " + JSON.stringify(listSpoils[key]));
        let x = listSpoils[key].col;
        let y = listSpoils[key].row;
        nodes[y][x].value = ITEM;
        nodes[y][x].spoilType = listSpoils[key].spoil_type;
      }
    }
  };
  this.updateMapBooms = function(listBombMap, myPower, killPower) {
    console.log(`[${mode}][updateMapBooms] listBombMap: `, listBombMap);
    let listBombUpdate = [];
    let size = listBombMap.length;
    for (let i = 0; i < size; i++) {
      let bomb = listBombMap[i];
      listBombUpdate.push(bomb);
      if (this.isMyBomb(bomb)) {
        checkMyBombExist = true;
        listBombUpdate.push(...this.getMapBomb(bomb, myPower));
      } else {
        listBombUpdate.push(...this.getMapBomb(bomb, killPower));
      }
    }
    if (!checkMyBombExist && listmyBomb.length > 0 && mode === DONE_BOMB) {
      listBombUpdate.push(listmyBomb[0]);
      listBombUpdate.push(...this.getMapBomb(listmyBomb[0], myPower));
    }
    let len = listBombUpdate.length;
    console.log(`[${mode}][updateMapBooms] listBombUpdate: `, listBombUpdate);
    for (let j = 0; j < len; j++) {
      let x = listBombUpdate[j].col;
      let y = listBombUpdate[j].row;
      if (nodes[y][x].value == BLANK) {
        nodes[y][x].value = BOMBB;
        nodes[y][x].remainTime = listBombUpdate[j].remainTime;
      }
    }
  };
  this.getMapBomb = function(bomb, myPower) {
    let result = [];
    let x = bomb.col;
    let y = bomb.row;
    for (let i = 1; i <= myPower; i++) {
      if (x + i < cols - 1) {
        result.push({ row: y, col: x + i, remainTime: 99 }); // x++
      }
      if (x - i > 0) {
        result.push({ row: y, col: x - i, remainTime: 99 }); // x--
      }
      if (y + i < rows - 1) {
        result.push({ row: y + i, col: x, remainTime: 99 }); // y++
      }
      if (y - i > 0) {
        result.push({ row: y - i, col: x, remainTime: 99 }); // y--
      }
    }
    return result;
  };
  this.isMyBomb = function(bomb) {
    let size = listmyBomb.length;
    for (let i = 0; i < size; i++) {
      let myBomb = listmyBomb[i];
      if (myBomb.row === bomb.row && myBomb.col === bomb.col) {
        return true;
      }
    }
    return false;
  };
  this.resetAllNode = function() {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        node = nodes[i][j];
        if (node.value == BOMBB || node.value == VALUE) {
          node.previous = undefined;
          node.value = BLANK;
          node.remainTime = -1;
        }
      }
    }
  };

  this.findPath = function(
    start,
    map,
    listBombMap,
    myPower,
    killPower,
    listSpoils
  ) {
    let node;
    checkMyBombExist = false;
    if (
      cachePoint != null &&
      (cachePoint.x != start.x || cachePoint.y != start.y)
    ) {
      console.log(`[${mode}]cachePoint: ${JSON.stringify(cachePoint)}`);
      return null;
    }
    if (open) {
      open.clear();
      // reset all nodes
      this.resetAllNode();
    } else {
      open = new Queue();
    }
    this.updateMap(map, listBombMap, myPower, killPower, listSpoils);
    console.log(`[${mode}][findPath] nodes: `, nodes);
    // add the start node to queue
    open.enqueue(start);
    if (mode === STOP) {
      if (checkMyBombExist) {
        console.log(`[${mode}][findPath] STOP`);
        return null;
      } else {
        listmyBomb = [];
        console.log(`[${mode}][findPath] DONE_BOMB Timeout`);
        mode = DONE_VALUE;
      }
    }
    // the main loop
    while (!open.isEmpty()) {
      node = open.dequeue();
      if (node) {
        if (node.value === mode) {
          let solution = getSolution(node);
          let listStep = getString(start, solution);
          if (mode === DONE_VALUE) {
            cachePoint = {
              x: solution[1].x,
              y: solution[1].y
            };
            cacheValue = {
              x: solution[0].x,
              y: solution[0].y
            };
          } else {
            cachePoint = {
              x: solution[0].x,
              y: solution[0].y
            };
          }
          console.log(`[${mode}]cachePoint: ${JSON.stringify(cachePoint)}`);
          // if (listStep.length <= 1) {
          if (mode === DONE_VALUE) {
            console.log(`[${mode}][findPath] DONE_VALUE`);
            if (listStep.length <= 1) {
              listStep = BOMB;
              listmyBomb.push({ row: start.y, col: start.x });
              console.log(`[${mode}]BORBSS: x: ${start.x} y: ${start.y}`);
            } else {
              listStep = `${listStep.substr(0, listStep.length - 1)}${BOMB}`;
              listmyBomb.push({ row: solution[1].y, col: solution[1].x });
              console.log(
                `[${mode}]BORBSS: x: ${solution[1].x} y: ${solution[1].y}`
              );
            }
            mode = DONE_BOMB;
          } else if (mode === DONE_BOMB) {
            console.log(`[${mode}][findPath] DONE_BOMB`);
            mode = STOP;
          }
          // else if (mode === DONE_BOMB && !checkMyBombExist) {
          //   listmyBomb = [];
          //   console.log("[findPath] DONE_BOMB Timeout");
          //   mode = DONE_VALUE;
          // }
          else if (mode === DONE_ITEM && !checkMyBombExist) {
            listmyBomb = [];
            console.log(`[${mode}][findPath] DONE_ITEM`);
            mode = DONE_VALUE;
          }
          // }
          // switch (mode){
          //   case DONE_VALUE: mode = DONE_BOMB; listStep = listStep.slice(0,(listStep.length - 1)) + "b"; break;
          //   case DONE_ITEM: mode = DONE_VALUE; break;
          //   case DONE_BOMB: mode = DONE_ITEM; break;
          // }
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
    var node = nodes[y][x];

    if (node.value == BLANK) {
      if (mode == DONE_BOMB) {
        node.value = DONE_BOMB;
      } else {
        node.value = VISITED;
      }
      // store the previous node
      // so that we can backtrack to find the optimum path
      // (by using the getSolution() method)
      node.previous = previous;
      open.enqueue(node);
    } else if (node.value == BOMBB && mode == DONE_BOMB) {
      node.value = VISITED;
      // store the previous node
      // so that we can backtrack to find the optimum path
      // (by using the getSolution() method)
      node.previous = previous;
      open.enqueue(node);
    } else if (node.value == ITEM) {
      // mark this node as visited to avoid adding it multiple times
      node.value = DONE_ITEM;
      // store the previous node
      // so that we can backtrack to find the optimum path
      // (by using the getSolution() method)
      node.previous = previous;
      open.enqueue(node);
    } else if (node.value == VALUE && mode == DONE_VALUE) {
      // mark this node as visited to avoid adding it multiple times
      node.value = DONE_VALUE;
      // store the previous node
      // so that we can backtrack to find the optimum path
      // (by using the getSolution() method)
      node.previous = previous;
      open.enqueue(node);
    }
  }
  function getSolution(p) {
    var nodes = [];
    nodes.push(p);
    while (p.previous) {
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
