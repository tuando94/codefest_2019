const LEFT = "1";
const RIGHT = "2";
const UP = "3";
const DOWN = "4";
const BOMB = "b";

const STOP = -1;
const BLANK = 0;
const WALL = 1;
const VALUE = 2;
const VISITED = 3;
const BOMBB = 4;
const ITEM = 5;

const RUN_BOMBB = 6;
const DONE_VALUE = 7;
const DONE_ITEM = 8;
const DONE_BOMB = 9;

const MODE_START = -1;
const MODE_RUN_BOMB_SUCCESS = -2;
const MODE_RUN_VALUE_SUCCESS = -3;
const MODE_RUN_ITEM_SUCCESS = -4;
const MODE_RUN_VALUE = 7;  // tìm thùng vật phẩm
const MODE_RUN_ITEM = 8;   //tìm item 
const MODE_RUN_BOMB = 9;   // tìm vị trí né bomb
// const KILL = 6;

const SPEED = 0;
const POWER = 1;
const DELAY = 2;
// const CELL_SIZE = 13;
// const FPS = 8;
// const WIDTH = 200;
const TIME_BOMB = 2000;
const TIME_DELAY_REQUEST = 5000;
const TIME_ANIMATION_BOMB = 50;
const TIME_ANIMATION_SPACESTONE = 1000;
const TIME_MILLISECOND_STEP = 1000;  // 1: 1000ms/step   2: 700ms/step

//event socketIO 
const JOIN_GAME = "join game";
const TICKTACK_PLAYER = "ticktack player";
const DRIVE_PLAYER = "drive player";
const CONNECT_FAIL = "connect_failed";
const CONNECT = "connect";
const DISCONNECT = "disconnect";
const ERROR = "error";


const SPACE_STONE = 3;
const MIND_STONE = 4;
const REALITY_STONE = 5;
const POWER_STONE = 6;
const TIME_STONE = 7;
const SOUL_STONE = 8;

const MIN_SPEED = 75;

const STYLE_LOG = "background: #ffffff; color: #ff0000; font-size:13px;";

const SERVER = "https://codefest.techover.io";
const GAME_ID = "093837d5-e190-41fb-8cf4-5b1e8ab84efe";
const PLAYER_ID = "player2-xxx-xxx-xxx";
