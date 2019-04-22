///<reference path="babylon.d.ts" />

//application data
var palletes: BABYLON.Texture[] = [];
var currentPallet: number =0;

class Title {
  public _canvas: HTMLCanvasElement;
  public _engine: BABYLON.Engine;
  public _scene: BABYLON.Scene;
  public _camera: BABYLON.ArcRotateCamera;
  public _playerSprite: BABYLON.Sprite;
  
  public _fade: fadeManager;
  public _TitleSprites: BABYLON.Sprite[] = [];
  

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
      
      palletes.forEach( p => p.dispose());
      palletes = [];
      //setTimeout(function() {
          let game = new Game('renderCanvas');
          // Create the scene.
          game.createScene();
          // Start render loop.
          game.doRender();
       //}, 500);
    });

    //setup pp
    let palletteEffect = new BABYLON.PostProcess("retro", "./Assets/Effects/retroClamp", ["screenSize", "colorPrecision"], ["pallete"], 0.15, this._camera);
    palletes.push(new BABYLON.Texture("./Assets/Effects/paletteGB.png", this._scene));
    palletes.push(new BABYLON.Texture("./Assets/Effects/paletteBerry.png", this._scene));
    palletes.push(new BABYLON.Texture("./Assets/Effects/paletteLolipop.png", this._scene));
    palletes.push(new BABYLON.Texture("./Assets/Effects/paletteSepia.png", this._scene));
    
    palletteEffect.onApply = function (effect) {
        effect.setFloat2("screenSize", palletteEffect.width, palletteEffect.height);
        effect.setTexture("pallete", palletes[currentPallet]);
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

    // Generate title text
    let spriteManagerTitle = new BABYLON.SpriteManager("playerManager","Assets/Sprites/Title.png", 26, {width: 64, height: 64}, this._scene);
    let indexes : string[] = ['T','O','W','E','R','H','U','G',' '];
    let createWords = (letter: string)=> {
        let sprit = new BABYLON.Sprite("Letter", spriteManagerTitle);
        sprit.cellIndex = indexes.indexOf(letter);
        sprit.size = 4;
        this._TitleSprites.push(sprit);
    }

    ['T','H','R','O','U','G','H',' ',' ','T','H','E',' ',' ','T','O','W','E','R',' ',' ',' ',' '].forEach((l)=> createWords(l));
    //setup update
    this._scene.onBeforeRenderObservable.add(()=>this.update());

    // Start music
    var intro = new BABYLON.Sound(
      "intro", "./Assets/Music/intro.wav", this._scene, null, {
         loop: true, 
         autoplay: true //change to play 
      }
    );
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
      
      // update the letters
      this._TitleSprites.forEach((letter, index) =>{
        letter.position = generatePointOnCircle(2*Math.PI/this._TitleSprites.length * index, 13, 2 + Math.sin(this._camera.alpha*6 + index));
      });
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

  document.addEventListener('keydown', function(event){
    if(event.key === '1') currentPallet = (currentPallet+1)%palletes.length;
  } );

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

class towerObject {
    public position : BABYLON.Vector2;
    public velocity : BABYLON.Vector2;
    public radius : number;
    public sprite : BABYLON.Sprite;
    public collisionMesh : BABYLON.Mesh;
    public grounded : boolean = false;
    constructor(position : BABYLON.Vector2, radius : number, sprite : BABYLON.Sprite, scene : BABYLON.Scene ) {
      this.position = position;
      this.radius = radius;
      this.sprite = sprite;
      this.collisionMesh = BABYLON.BoxBuilder.CreateBox("BoxCollider",{size: 2}, scene);
      this.collisionMesh.checkCollisions = true;
      this.collisionMesh.isVisible = false;
      this.update();
      this.collisionMesh.position = this.sprite.position;
      this.velocity = new BABYLON.Vector2;
      
    }
    public update (){
      this.sprite.position = this.getLocalPosition(this.position);
      this.collisionMesh.position = this.sprite.position;
      this.collisionMesh.lookAt(generatePointOnCircle(this.position.x % (2*Math.PI), this.radius+2, this.position.y));
    }
    public getLocalPosition (pos : BABYLON.Vector2): BABYLON.Vector3 {
      return generatePointOnCircle(pos.x % (2*Math.PI), this.radius, pos.y);
    }
}

function generatePointOnCircle (X, radius, y) {
    let x = Math.cos(X) * radius;
    let z = Math.sin(X) * radius;
    return new BABYLON.Vector3(x,y,z);
}

function generateCylindricalPoint (v : BABYLON.Vector3){
  let angle = Math.atan2(v.z,v.x);
  let radius = Math.sqrt(v.x*v.x + v.z*v.z);
  let height = v.y;
  if(angle < 0) angle = 2*Math.PI + angle; //dumb correction
  return [angle, radius, height];
}