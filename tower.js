///<reference path="babylon.d.ts" />
var Game = /** @class */ (function () {
    function Game(canvasElement) {
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
    }
    Game.prototype.createScene = function () {
        var _this = this;
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        // Parameters: alpha, beta, radius, target position, scene
        this._camera = new BABYLON.ArcRotateCamera("mainCam", 0, Math.PI / 2, 30, new BABYLON.Vector3(0, 0, 0), this._scene);
        // Attach the camera to the canvas.
        this._camera.attachControl(this._canvas, false);
        this._camera.inputs.clear();
        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
        // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
        var TowerCore = BABYLON.MeshBuilder.CreateCylinder("TowerCore", { height: 40, diameter: 20, tessellation: 8, subdivisions: 5 }, this._scene);
        var brickMat = new BABYLON.StandardMaterial("brick", this._scene);
        var tex = new BABYLON.Texture("./Assets/Textures/brick.png", this._scene);
        tex.uScale = 10;
        tex.vScale = 10;
        brickMat.diffuseTexture = tex;
        TowerCore.material = brickMat;
        var keyheld = false;
        // Setup
        this._scene.actionManager = new BABYLON.ActionManager(this._scene);
        this._scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: 'a'
        }, function () { keyheld = true; }));
        this._scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyUpTrigger,
            parameter: 'a'
        }, function () { keyheld = false; }));
        //setup pp
        var postProcess = new BABYLON.PostProcess("retro", "./Assets/Effects/retroClamp", ["screenSize", "colorPrecision"], ["pallete"], 0.15, this._camera);
        var pallete = new BABYLON.Texture("./Assets/Effects/paletteGB.png", this._scene);
        postProcess.onApply = function (effect) {
            effect.setFloat2("screenSize", postProcess.width, postProcess.height);
            effect.setTexture("pallete", pallete);
            effect.setFloat("colorPrecision", 8);
        };
        //setup update
        this._scene.onBeforeRenderObservable.add(function () { return _this.update(); });
    };
    Game.prototype.doRender = function () {
        var _this = this;
        // Run the render loop.
        this._engine.runRenderLoop(function () {
            _this._scene.render();
        });
        // The canvas/window resize event handler.
        window.addEventListener('resize', function () {
            _this._engine.resize();
        });
    };
    // runs before render
    Game.prototype.update = function () {
        //TowerCore.addRotation(0,0.01,0);
        //if(keyheld) TowerCore.position.x -= 0.1;
        if (this._camera != null) {
            this._camera.alpha += 0.01;
        }
    };
    return Game;
}());
window.addEventListener('DOMContentLoaded', function () {
    // Create the game using the 'renderCanvas'.
    var game = new Game('renderCanvas');
    // Create the scene.
    game.createScene();
    // Start render loop.
    game.doRender();
});
/*
we want to use this later to render holes in the tower
var sphereCSG = BABYLON.CSG.FromMesh(sphere);
var cylinderCSG = BABYLON.CSG.FromMesh(cylinder);
sphereCSG.subtractInPlace(cylinderCSG);
var ball = sphereCSG.toMesh("test", sphere.material, scene, false);

*/ 
