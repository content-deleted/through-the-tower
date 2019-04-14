///<reference path="babylon.d.ts" />
class Game {
  public _canvas: HTMLCanvasElement;
  public _engine: BABYLON.Engine;
  public _scene: BABYLON.Scene;
  public _camera: BABYLON.ArcRotateCamera;
  public _light: BABYLON.Light;
  public _playerInput: PlayerInput;
  public _playerSprite: BABYLON.Sprite;

  constructor(canvasElement : string) {
    // Create canvas and engine.
    this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    console.log("StartingMainGameLoop");
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
    this._playerInput = new PlayerInput(this._scene);

    //setup pp
    let palletteEffect = new BABYLON.PostProcess("retro", "./Assets/Effects/retroClamp", ["screenSize", "colorPrecision"], ["pallete"], 0.15, this._camera);
    let pallete = new BABYLON.Texture("./Assets/Effects/palette.png", this._scene);
    palletteEffect.onApply = function (effect) {
        effect.setFloat2("screenSize", palletteEffect.width, palletteEffect.height);
        effect.setTexture("pallete", pallete);
        effect.setFloat("colorPrecision", 8);
    };

    let Fade = new BABYLON.PostProcess("fade", "./Assets/Effects/fade", ["Fade"], null, 1, this._camera);
    let brightAmount=1;
    Fade.onApply = (effect) => {
        effect.setFloat("Fade", brightAmount);
    };

    this.startCloud();
    
    //
    let spriteManagerPlayer = new BABYLON.SpriteManager("playerManager","Assets/Sprites/Player.png", 4, {width: 64, height: 64}, this._scene);
    
    this._playerSprite = new BABYLON.Sprite("player", spriteManagerPlayer);
    this._playerSprite.position = new BABYLON.Vector3(0,5, 10);
    this._playerSprite.size *= 5;
    this._playerSprite.playAnimation(0, 3, true,100,() => {});

    /*this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          BABYLON.ActionManager.OnEveryFrameTrigger,
          () => {
              let dir = this._playerInput.getDirection();
              player.position.x += dir.x;
              player.position.z += dir.y;
          }
      )
    );*/

    //setup update
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
    let dir = this._playerInput.getDirection();
    this._playerSprite.position.x += dir.x;
    this._playerSprite.position.z += dir.y;
    if(this._camera != null) {
      this._camera.alpha += 0.01;
    }
  }

  startCloud(): void {
    let fogTexture : BABYLON.Texture = new BABYLON.Texture("https://raw.githubusercontent.com/aWeirdo/Babylon.js/master/smoke_15.png", this._scene);
    let particleSystem;
    particleSystem = new BABYLON.ParticleSystem("particles", 2500 , this._scene);
    particleSystem.manualEmitCount = particleSystem.getCapacity();
    particleSystem.minEmitBox = new BABYLON.Vector3(-25, 2, -25); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(25, 2, 25); // To...
    

    particleSystem.particleTexture = fogTexture.clone();
    var fountain = BABYLON.Mesh.CreateBox("foutain", .01, this._scene);
    fountain.position.y = -5;
    fountain.visibility = 0;
    particleSystem.emitter = fountain;
    
    particleSystem.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.1);
    particleSystem.color2 = new BABYLON.Color4(.95, .95, .95, 0.15);
    particleSystem.colorDead = new BABYLON.Color4(0.9, 0.9, 0.9, 0.1);
    particleSystem.minSize = 3.5;
    particleSystem.maxSize = 5.0;
    particleSystem.minLifeTime = 9007199254740991;
    particleSystem.emitRate = 5000;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction1 = new BABYLON.Vector3(0, 0, 0);
    particleSystem.direction2 = new BABYLON.Vector3(0, 0, 0);
    particleSystem.minAngularSpeed = -2;
    particleSystem.maxAngularSpeed = 2;
    particleSystem.minEmitPower = .5;
    particleSystem.maxEmitPower = 1;
    particleSystem.updateSpeed = 0.005;

    particleSystem.start();
  }

}

class keyInput {
  public isDown : boolean;
  public key : string;
  constructor(key : string, onPress : () => void, onRelease : () => void, scene : BABYLON.Scene) {
    this.key = key;
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyDownTrigger,
              parameter: key
          },
          ()=> { this.isDown = true; onPress(); }
      )
    );
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
          {
              trigger: BABYLON.ActionManager.OnKeyUpTrigger,
              parameter: key
          },
          ()=> { this.isDown = false; onRelease(); }
      )
    );
  }
}

class PlayerInput {
  public up : keyInput;
  public down : keyInput;
  public left : keyInput;
  public right : keyInput;

  public dash : keyInput;
  public special : keyInput;

  public getDirection () : BABYLON.Vector2 {
    let dir = new BABYLON.Vector2(0,0);
    console.log(dir);
    if(this.up.isDown) dir.y +=1;
    if(this.down.isDown) dir.y -=1;
    if(this.left.isDown) dir.x -=1;
    if(this.right.isDown) dir.x +=1;

    return dir.normalize();
  }

  constructor(scene : BABYLON.Scene) {
    this.up = new keyInput('w', ()=>{},()=>{}, scene);
    this.down = new keyInput('s', ()=>{},()=>{}, scene);
    this.left = new keyInput('a', ()=>{},()=>{}, scene);
    this.right = new keyInput('d', ()=>{},()=>{}, scene);
  }
}



/*
we want to use this later to render holes in the tower
var sphereCSG = BABYLON.CSG.FromMesh(sphere);
var cylinderCSG = BABYLON.CSG.FromMesh(cylinder);
sphereCSG.subtractInPlace(cylinderCSG);
var ball = sphereCSG.toMesh("test", sphere.material, scene, false);

*/