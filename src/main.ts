import * as nwgui from "nw.gui";
import * as dimensions from "./const/dimensions";
import * as Keycodes from "./const/keycodes";
import { Game } from "./game/Game";
import * as GameClock from "./providers/GameClock";
import * as Keyboard from "./providers/Keyboard";
import * as Mouse from "./providers/Mouse";
import * as Stage from "./providers/Stage";

// tslint:disable-next-line:interface-name
interface Window extends NWJS_Helpers.win {
    reload: (arg?: number) => void;
}

let info: Element;

// update the debug info in the bottom right of the screen
export function debug(message: string) {
    if (!info) info = window.document.querySelector("#info") || new Element();
    info.innerHTML = message.replace(/\n/g, "<br/>");
}

function main() {
    let win = <Window> nwgui.Window.get();

    // win.enterFullscreen();
    let renderer: PIXI.SystemRenderer = new PIXI.WebGLRenderer(dimensions.SCREEN_WIDTH,
                                                               dimensions.SCREEN_HEIGHT,
                                                               { backgroundColor : 0xDDDDDD });
    renderer.view.classList.add("scaling");
    renderer.view.id = "stage";
    (document.querySelector("#canvas-screen") || new Element()).appendChild(renderer.view);
    let stage: PIXI.Container = new PIXI.Container();
    // win.addListener("focus", e => renderer.view.requestPointerLock());
    // renderer.view.requestPointerLock();
    // renderer.view.addEventListener("mousemove", e => console.log(e.movementX, e.movementY));

    Mouse.Init(window, renderer.view);
    GameClock.Init(60);
    Keyboard.Init(document.body);
    Stage.Init(win, renderer, stage);

    stage.addChild(new Game());

    // global hotkeys
    // escape closes the window
    Keyboard.provider().do(() => win.close(), (key) => key.pressed && key.keyCode === Keycodes.ESCAPE);
    // F12 opens dev tools
    Keyboard.provider().do(() => win.showDevTools(), (key) => key.pressed && key.keyCode === Keycodes.F12);
    // F11 reloads the window
    Keyboard.provider().do(() => win.reload(3), (key) => !key.pressed && key.keyCode === Keycodes.F11);
    // ALT + F toggles fullscreen
    Keyboard.provider().do(() => win.toggleFullscreen(), (key) => key.pressed && key.keyCode === Keycodes.F &&
                                                                Keyboard.isKeyDown(Keycodes.ALT));
    let debugVisible = true;
    // F10 toggles debug info
    Keyboard.provider().do(() => (<HTMLParagraphElement> document.querySelector("#info")).style.visibility =
                                                            (debugVisible = !debugVisible) ? "visible" : "hidden",
        (key) => key.pressed && key.keyCode === Keycodes.F10);

    // frame rendering uses requestAnimationFrame for acceleration
    let frameTime: number = 1000;
    GameClock.provider().do((o) => {
        frameTime = frameTime * 0.7 + o.dt * 0.3;
        debug("FPS: " + Math.round(1000 / frameTime));
    });
    let tick: () => void;
    requestAnimationFrame(tick = () => {
        renderer.render(stage);
        requestAnimationFrame(tick);
    });
}
