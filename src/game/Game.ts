import * as dimensions from "../const/dimensions";
import * as Keycodes from "../const/keycodes";
import * as GameClock from "../providers/GameClock";
import * as Keyboard from "../providers/Keyboard";

const CAMERA_EASE = 0.1;
const GRAVITY = 0.2;

export class Game extends PIXI.Sprite {

    public player = new Player();
    public map = new Map();
    public playerSprite: PIXI.Sprite;

    public controls = {
        jump: false,
        left: false,
        right: false,
    };

    constructor() {
        super();

        let mapGraphic = new PIXI.Container();
        for (let i = 0; i < this.map.width; i ++) {
            for (let j = 0; j < this.map.height; j ++) {
                if (this.map.isCellSolid(i, j)) {
                    let cellGraphic = new PIXI.Graphics();
                    cellGraphic.beginFill(0);
                    cellGraphic.drawRect(0, 0, Map.CELL_SIZE, Map.CELL_SIZE);
                    cellGraphic.endFill();
                    cellGraphic.x = i * Map.CELL_SIZE;
                    cellGraphic.y = j * Map.CELL_SIZE;
                    mapGraphic.addChild(cellGraphic);
                }
            }
        }
        this.addChild(mapGraphic);

        this.playerSprite = new PIXI.Sprite();
        let playerGraphic = new PIXI.Graphics();
        playerGraphic.beginFill(0xFF0000);
        playerGraphic.drawRect(0, 0, this.player.width * Map.CELL_SIZE, this.player.height * Map.CELL_SIZE);
        playerGraphic.endFill();
        this.playerSprite.addChild(playerGraphic);
        this.addChild(this.playerSprite);

        GameClock.provider().do(() => {
            this.update();
            this.graphics();
        });
    }

    public fetchControls() {
        this.controls.left = Keyboard.isKeyDown(Keycodes.ARROW_LEFT);
        this.controls.right = Keyboard.isKeyDown(Keycodes.ARROW_RIGHT);
        this.controls.jump = Keyboard.isKeyDown(Keycodes.SPACE);
    }

    public update() {
        if (this.map.areAnySolid(this.player.feet)) { // is grounded?
            this.player.y = this.player.feetSnapPixel(); // snap to ground
            if (this.controls.left) {
                //
            } else if (this.controls.right) {
                //
            }
        } else {
            this.player.vy += GRAVITY; // gravity
        }

        let pmx = this.player.vx;
        let leadingEdge: number;
        if (pmx > 0) leadingEdge = this.player.right;
        else leadingEdge = this.player.left;

        let pmy = this.player.vy;
    }

    public graphics() {
        this.playerSprite.x = this.player.x * Map.CELL_SIZE;
        this.playerSprite.y = this.player.y * Map.CELL_SIZE;
        let tx = -this.playerSprite.x + dimensions.SCREEN_WIDTH / 2 - 20;
        let ty = -this.playerSprite.y + dimensions.SCREEN_HEIGHT / 2 - 20;
        this.x = this.x * (1 - CAMERA_EASE) + tx * (CAMERA_EASE);
        this.y = this.y * (1 - CAMERA_EASE) + ty * (CAMERA_EASE);
    }

}

class Player {
    public x: number = 2;
    public y: number = 28;

    public vx = 0;
    public vy = 0;

    public width = 0.8;
    public height = 0.8;

    public epsilon = 0.01;

    get feet() {
        return [{x: this.x + this.epsilon, y: this.y + this.height}, {x: this.x + this.width - this.epsilon, y: this.y + this.height}];
    }

    get head() {
        return [{x: this.x + this.epsilon, y: this.y}, {x: this.x + this.width - this.epsilon, y: this.y}];
    }

    get left() { return this.x; }
    get right() { return this.x + this.width; }
    // get top() { return this.y; }
    // get bottom() { return this.y + this.height; }

    public feetSnapPixel() {
        return Math.ceil(this.y) - this.height;
    }

    public headSnapPixel() {
        return Math.ceil(this.y);
    }
}

class Map {
    public static CELL_SIZE = 50;

    public width = 30;
    public height = 30;

    public cells =
[ [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 1, 1, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 ],
  [ 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1 ],
  [ 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1 ],
  [ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1 ] ];

    constructor() {
        //
    }

    public getCellData(x: number, y: number) {
        if (x < 0 || x > this.cells.length * Map.CELL_SIZE || y < 0 || y > this.cells[0].length * Map.CELL_SIZE) return 1;
        return this.cells[Math.floor(x)][Math.floor(y)];
    }

    public isCellSolid(x: number, y: number) {
        return this.getCellData(x, y) === 1;
    }

    public areAnySolid(coords: {x: number, y: number}[]) {
        for (let coord of coords) {
            if (this.isCellSolid(coord.x, coord.y)) return true;
        }
        return false;
    }
}
