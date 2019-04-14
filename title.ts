///<reference path="babylon.d.ts" />

//application data
var pallet = [];
var currentPallet=0;

class Title {
  public _canvas: HTMLCanvasElement;
  public _engine: BABYLON.Engine;
  public _scene: BABYLON.Scene;
  public _camera: BABYLON.ArcRotateCamera;
  public _playerSprite: BABYLON.Sprite;
  
  public _fade: fadeManager;
  

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
    let light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);

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

    // setup fade manager
    this._fade = new fadeManager(0.005, ()=> {
      this._engine.runRenderLoop(()=>{});
      this._engine.stopRenderLoop();
      
      this._scene.dispose();
      this._engine.dispose();
      
      // Create the game using the 'renderCanvas'.
      
      
      //setTimeout(function() {
          let game = new Game('renderCanvas');
          // Create the scene.
          game.createScene();
          // Start render loop.
          game.doRender();
       // }, 1000);
    });

    //setup pp
    let palletteEffect = new BABYLON.PostProcess("retro", "./Assets/Effects/retroClamp", ["screenSize", "colorPrecision"], ["pallete"], 0.15, this._camera);
    let pallete = new BABYLON.Texture("./Assets/Effects/palette.png", this._scene);
    palletteEffect.onApply = function (effect) {
        effect.setFloat2("screenSize", palletteEffect.width, palletteEffect.height);
        effect.setTexture("pallete", pallete);
        effect.setFloat("colorPrecision", 8);
    };

    let Fade = new BABYLON.PostProcess("fade", "./Assets/Effects/fade", ["Fade"], null, 1, this._camera);

    Fade.onApply = (effect) => {
        effect.setFloat("Fade", this._fade.current);
    };

    this.startCloud();
    
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "j"
        },
        () => {
          this._fade.running=true;
        }
      )
    );

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
    if(this._camera != null) {
      this._camera.alpha += 0.01;
    }
    this._fade.update();
  }

  startCloud(): void {
    let fogTexture : BABYLON.Texture = new BABYLON.Texture("./Assets/Textures/smoke_15.png", this._scene);
    let particleSystem;
    particleSystem = new BABYLON.ParticleSystem("particles", 2500 , this._scene);
    particleSystem.manualEmitCount = particleSystem.getCapacity();
    particleSystem.minEmitBox = new BABYLON.Vector3(-25, 2, -25); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(25, 2, 25); // To...
    

    particleSystem.particleTexture = fogTexture.clone();
    // creates a bounding box of particles 
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

window.addEventListener('DOMContentLoaded', () => {
  // Create the game using the 'renderCanvas'.
  let title = new Title('renderCanvas');

  // Create the scene.
  title.createScene();

  // Start render loop.
  title.doRender();
});


class fadeManager {
  public running : boolean = false;
  public current = 1.0;
  public increment: number;
  public callback;
  constructor(increment: number, faded: () => void) {
    this.increment = increment;
    this.callback = faded;
  }
  public update () {
    if( this.running && this.current >= 0) {
      this.current -= this.increment;
      if(this.current<0){
        this.callback();
      }
    }
  }
}