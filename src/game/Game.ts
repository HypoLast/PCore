import * as fs from "fs";
import * as dimensions from "../const/dimensions";
import * as Keycodes from "../const/keycodes";
import * as GameClock from "../providers/GameClock";
import * as Keyboard from "../providers/Keyboard";

const CAMERA_EASE = 0.1;
const GRAVITY = 0.015;

interface IControls {
    dashLeft: boolean;
    dashRight: boolean;
    jump: boolean;
    left: boolean;
    right: boolean;
}

export class Game extends PIXI.Sprite {

    public player: Player;
    public map: Map;
    public playerSprite: PIXI.Sprite;

    public controls: IControls = {
        dashLeft: false,
        dashRight: false,
        jump: false,
        left: false,
        right: false,
    };

    constructor() {
        super();

        this.map = new Map("test");
        this.player = new Player();
        this.player.x = this.map.startX;
        this.player.y = this.map.startY;

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
        return {
            dashLeft: Keyboard.isKeyDown(Keycodes.A),
            dashRight: Keyboard.isKeyDown(Keycodes.D),
            jump: Keyboard.isKeyDown(Keycodes.SPACE),
            left: Keyboard.isKeyDown(Keycodes.ARROW_LEFT),
            right: Keyboard.isKeyDown(Keycodes.ARROW_RIGHT),
        };
    }

    public update() {
        this.controls = this.fetchControls();
        this.player = this.incrementPlayerState(this.player, this.controls, this.map);
        this.player = this.movePlayer(this.player, this.map);
    }

    public incrementPlayerState(player: Player, controls: IControls, map: Map) {
        if (!controls.jump) player.jumpBuffered = true;
        if (!controls.dashLeft) player.dashLeftBuffered = true;
        if (!controls.dashRight) player.dashRightBuffered = true;
        if (map.areAnySolid(player.feet)) { // is grounded?
            if (controls.dashLeft) player.dashLeftBuffered = false;
            if (controls.dashRight) player.dashRightBuffered = false;
            player.canDash = true;
            player.y = player.feetSnap(); // snap to ground
            if (controls.left) {
                if (player.vx > 0) {
                    player.vx *= player.groundedDecay;
                }
                player.vx -= player.groundSpeed;
            } else if (controls.right) {
                if (player.vx < 0) {
                    player.vx *= player.groundedDecay;
                }
                player.vx += player.groundSpeed;
            } else {
                player.vx *= player.groundedDecay;
            }
            if (controls.jump && player.jumpBuffered) {
                player.vy = -player.jumpPower;
                player.jumpBuffered = false;
            }
            if (Math.abs(player.vx) > player.maxSpeed) {
                player.vx *= (player.maxSpeed / Math.abs(player.vx)) * (player.maxXDecay) + (1 - player.maxXDecay);
            }
        } else {
            let leftWallAdjacent = map.areAnySolid(player.left);
            let rightWallAdjacent = map.areAnySolid(player.right);
            if (controls.jump && player.jumpBuffered && (leftWallAdjacent || rightWallAdjacent)) {
                if (leftWallAdjacent) {
                    player.vx = player.wallJumpPowerX;
                } else if (rightWallAdjacent) {
                    player.vx = -player.wallJumpPowerX;
                }
                player.vy = -player.wallJumpPowerY;
                player.jumpBuffered = false;
            } else {
                if (player.canDash && ((controls.dashLeft && player.dashLeftBuffered && !leftWallAdjacent) ||
                                      (controls.dashRight && player.dashRightBuffered && !rightWallAdjacent))) {
                    if (controls.dashLeft) {
                        player.vx = -player.dashPower;
                    } else if (controls.dashRight) {
                        player.vx = player.dashPower;
                    }
                    player.vy -= player.dashPowerYBump;
                    player.canDash = false;
                }

                if (controls.jump || player.vy > 0) {
                    player.vy += GRAVITY;
                } else {
                    player.vy += GRAVITY * player.heavyGravity;
                }

                if (controls.left) {
                    if (player.vy > player.wallSlideSpeed && leftWallAdjacent) {
                        player.vy *= (player.wallSlideSpeed / player.vy) * (player.wallSlideDecay) + (1 - player.wallSlideDecay);
                    }
                    player.vx -= player.airSpeed;
                } else if (controls.right) {
                    if (player.vy > player.wallSlideSpeed && rightWallAdjacent) {
                        player.vy *= (player.wallSlideSpeed / player.vy) * (player.wallSlideDecay) + (1 - player.wallSlideDecay);
                    }
                    player.vx += player.airSpeed;
                }
            }
            player.vx *= 1 - player.airSpeedDecay;
        }

        return player;
    }

    public movePlayer(player: Player, map: Map) {
        let pmx = this.player.vx;
        let pmy = this.player.vy;
        if (Math.abs(pmx) < 0.0175 && !map.areAnySolid(player.feet) && (map.areAnySolid(player.left.concat(player.right)))) pmx = 0;
        while (pmx !== 0 || pmy !== 0) {
            if (pmy < 0) {
                let py = Math.max(pmy, -1);
                pmy -= py;
                player.y += py;
                if (map.areAnySolid(player.head)) {
                    player.y = player.headSnap();
                    player.vy = 0;
                    pmy = 0;
                }
            } else if (pmy > 0) {
                let py = Math.min(pmy, 1);
                pmy -= py;
                player.y += py;
                if (map.areAnySolid(player.feet)) {
                    player.y = player.feetSnap();
                    player.vy = 0;
                    pmy = 0;
                }
            }

            if (pmx < 0) {
                let px = Math.max(pmx, -1);
                pmx -= px;
                player.x += px;
                if (map.areAnySolid(player.left)) {
                    player.x = player.leftSnap();
                    player.vx = 0;
                    pmx = 0;
                }
            } else if (pmx > 0) {
                let px = Math.min(pmx, 1);
                pmx -= px;
                player.x += px;
                if (map.areAnySolid(player.right)) {
                    player.x = player.rightSnap();
                    player.vx = 0;
                    pmx = 0;
                }
            }
        }

        return player;
    }

    public graphics() {
        this.playerSprite.x = this.player.x * Map.CELL_SIZE;
        this.playerSprite.y = this.player.y * Map.CELL_SIZE;
        let tx = -this.playerSprite.x + dimensions.SCREEN_WIDTH / 2 - 20;
        let ty = -this.playerSprite.y + dimensions.SCREEN_HEIGHT / 2 - 20;
        this.x = Math.round(this.x * (1 - CAMERA_EASE) + tx * (CAMERA_EASE));
        this.y = Math.round(this.y * (1 - CAMERA_EASE) + ty * (CAMERA_EASE));
    }

}

class Player {
    public x: number = 0;
    public y: number = 0;

    public vx = 0;
    public vy = 0;

    public width = 0.8;
    public height = 0.8;

    public epsilon = 0.01;

    public groundSpeed = 0.01; // speed increase while moving on ground
    public airSpeed = 0.003; // speed increase while in air
    public maxSpeed = 0.1; // maximum velocity before decay
    public jumpPower = 0.25; // vertical velocity at jump launch
    public groundedDecay = 0.1; // decay ratio while grounded and not propelling
    public heavyGravity = 1.5; // gravity ratio while not holding jump
    public wallJumpPowerX = 0.11; // horizontal wall jump launch velocity
    public wallJumpPowerY = 0.22; // verical wall jump launch velocity
    public dashPower = 0.3; // horizontal dash velocity (absolute)
    public dashPowerYBump = 0.05; // vertical dash velocity increase
    public maxXDecay = 0.2; // when over max velocity decay towards max velocity with this ratio
    public airSpeedDecay = 0.02; // decay towards 0 while airborne
    public wallSlideSpeed = 0.005; // maximum wall slide speed before decay
    public wallSlideDecay = 0.1; // when wall sliding decay towards wall slide speed with this ratio
    public jumpBuffered = true;
    public canDash = true;
    public dashLeftBuffered = true;
    public dashRightBuffered = true;

    get feet() {
        return [{x: this.x + this.epsilon, y: this.y + this.height}, {x: this.x + this.width - this.epsilon, y: this.y + this.height}];
    }

    get head() {
        return [{x: this.x + this.epsilon, y: this.y - this.epsilon}, {x: this.x + this.width - this.epsilon, y: this.y - this.epsilon}];
    }

    get left() {
        return [{x: this.x - this.epsilon, y: this.y + this.epsilon}, {x: this.x - this.epsilon, y: this.y + this.height - this.epsilon}];
    }

    get right() {
        return [{x: this.x + this.width, y: this.y + this.epsilon}, {x: this.x + this.width, y: this.y + this.height - this.epsilon}];
    }

    public feetSnap() {
        return Math.ceil(this.y) - this.height;
    }

    public headSnap() {
        return Math.ceil(this.y - this.epsilon);
    }

    public leftSnap() {
        return Math.ceil(this.x - this.epsilon);
    }

    public rightSnap() {
        return Math.ceil(this.x) - this.width;
    }
}

class Map {
    public static CELL_SIZE = 50;

    public width: number;
    public height: number;
    public startX: number;
    public startY: number;

    public cells: number[][];

    constructor(file: string = "test") {
        try {
            let mapFile = JSON.parse(fs.readFileSync("res/maps/" + file + ".map", "ascii"));
            this.cells = mapFile.cells;
            [this.width, this.height] = mapFile.dim;
            [this.startX, this.startY] = mapFile.start;
        } catch (e) {
            console.log(e);
        }
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
