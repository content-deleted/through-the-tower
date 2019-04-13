///<reference path="babylon.d.ts" />

class Game {
  public _canvas: HTMLCanvasElement;
  public _engine: BABYLON.Engine;
  public _scene: BABYLON.Scene;
  public _camera: BABYLON.ArcRotateCamera;
  public _light: BABYLON.Light;

  constructor(canvasElement : string) {
    // Create canvas and engine.
    this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    this._engine = new BABYLON.Engine(this._canvas, true);
  }

  createScene() : void {
    // Create a basic BJS Scene object.
    this._scene = new BABYLON.Scene(this._engine);

    // Parameters: alpha, beta, radius, target position, scene
    this._camera = new BABYLON.ArcRotateCamera("mainCam", 0, Math.PI/2, 30, new BABYLON.Vector3(0,0,0), this._scene);

    // Attach the camera to the canvas.
    this._camera.attachControl(this._canvas, false);
    this._camera.inputs.clear();

    // Create a basic light, aiming 0,1,0 - meaning, to the sky.
    this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);

    // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
    let TowerCore = BABYLON.MeshBuilder.CreateCylinder("TowerCore",{height: 40, diameter: 20, tessellation: 8, subdivisions: 5}, this._scene);
    let brickMat = new BABYLON.StandardMaterial("brick", this._scene);
    let tex = new BABYLON.Texture("./Assets/Textures/brick.png", this._scene);
    tex.uScale = 10; tex.vScale = 10;
    brickMat.diffuseTexture = tex;
    TowerCore.material = brickMat;

    let keyheld : Boolean = false;

    // Setup
    this._scene.actionManager = new BABYLON.ActionManager(this._scene);
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyDownTrigger,
              parameter: 'a'
          },
          function () { keyheld = true; }
      )
    );
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyUpTrigger,
              parameter: 'a'
          },
          function () { keyheld = false; }
      )
    );

    this._scene.onBeforeRenderObservable.add(()=>this.update());
  }

  doRender() : void {
    // Run the render loop.
    this._engine.runRenderLoop(() => {
      this._scene.render();
    });

    // The canvas/window resize event handler.
    window.addEventListener('resize', () => {
        this._engine.resize();
    });
  }


  // runs before render
  update() : void {
    //TowerCore.addRotation(0,0.01,0);
    //if(keyheld) TowerCore.position.x -= 0.1;
    if(this._camera != null) {
      this._camera.alpha += 0.01;
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  // Create the game using the 'renderCanvas'.
  let game = new Game('renderCanvas');

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