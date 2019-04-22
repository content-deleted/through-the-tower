///<reference path="babylon.d.ts" />
class Game {
  public _canvas: HTMLCanvasElement;
  public _engine: BABYLON.Engine;
  public _scene: BABYLON.Scene;
  public _camera: BABYLON.ArcRotateCamera;
  public _light: BABYLON.Light;
  public _playerInput: PlayerInput;
  public _player: playerManager;

  public _towerCore: BABYLON.Mesh;
  public _towerCoreTexture: BABYLON.Texture;
  public _towerBlocks: BABYLON.Mesh [];
  public _disabledTowerBlocks: BABYLON.Mesh [] = [];

  public _towerSpeed: number = 0.02;

  constructor(canvasElement : string) {
    // Create canvas and engine.
    this._canvas = document.getElementById(canvasElement) as HTMLCanvasElement;
    console.log("StartingMainGameLoop");
    this._engine = new BABYLON.Engine(this._canvas, true);
  }

  createScene() : void {
    // Create a basic BJS Scene object.
    this._scene = new BABYLON.Scene(this._engine);
    //Physics?
    //this._scene.enablePhysics(new BABYLON.Vector3(0, -9.8,0));
    this._scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

    // Enable Collisions
    this._scene.collisionsEnabled = true;

    // Parameters: alpha, beta, radius, target position, scene
    this._camera = new BABYLON.ArcRotateCamera("mainCam", 0, Math.PI/2, 25, new BABYLON.Vector3(0,0,0), this._scene);

    // Attach the camera to the canvas.
    this._camera.attachControl(this._canvas, false);
    this._camera.inputs.clear();

    
    // Create a basic light, aiming 0,1,0 - meaning, to the sky.
    this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0,1,0), this._scene);

    // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
    let _towerCore = BABYLON.MeshBuilder.CreateCylinder("TowerCore",{height: 40, diameter: 20, tessellation: 8, subdivisions: 5}, this._scene);
    //_towerCore.physicsImpostor = new BABYLON.PhysicsImpostor(_towerCore,BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 0, restitution: 0.9 }, this._scene);
    _towerCore.checkCollisions = true;

    let brickMat = new BABYLON.StandardMaterial("brick", this._scene);
    this._towerCoreTexture = new BABYLON.Texture("./Assets/Textures/brick.png", this._scene);
    this._towerCoreTexture.uScale = 10; this._towerCoreTexture.vScale = 10;
    brickMat.diffuseTexture = this._towerCoreTexture;
    _towerCore.material = brickMat;

    let blockTex  = new BABYLON.Texture("./Assets/Textures/brick.png", this._scene);
    let blockMat = new BABYLON.StandardMaterial("block", this._scene);
    blockMat.diffuseTexture = blockTex;
    this._towerBlocks = [];
    for(let i:number = 0; i < 30; i ++){
      let b = BABYLON.BoxBuilder.CreateBox("Block",{size:2.5}, this._scene);
      let x = 2*Math.PI/10 * i + Math.floor(i/10) * 5;
      let y = Math.floor(i/10) * 6 - 8;
      b.position = generatePointOnCircle(x, 12, y);
      b.lookAt(generatePointOnCircle(x, 14,y));
      //b.physicsImpostor = new BABYLON.PhysicsImpostor(b, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 0.9}, this._scene);
      b.checkCollisions = true;
      b.material = blockMat;
      this._towerBlocks.push(b);
    }

    // Setup
    this._scene.actionManager = new BABYLON.ActionManager(this._scene);
    this._playerInput = new PlayerInput(this._scene);

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
    let brightAmount=1;
    Fade.onApply = (effect) => {
        effect.setFloat("Fade", brightAmount);
    };

    this.startCloud();
    
    //
    let spriteManagerPlayer = new BABYLON.SpriteManager("playerManager","Assets/Sprites/Player.png", 6, {width: 64, height: 64}, this._scene);
    
    this._player = new playerManager(new BABYLON.Vector2(0,0), 13, spriteManagerPlayer, this._scene, 3);
    this._player.dashSpeed = 0.05;
    this._player.dashLength = 10;
    this._player.cooldownLength = 6;
    this._player.framesCooldown = 6;
    this._player.sprite.playAnimation(0, 3, true,100,() => {});

    // Jump Action
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "j"
        },
        () => {
          if(this._player.grounded) this._player.velocity.y = 0.75;
        }
      )
    );

    // Dash Action
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "k"
        },
        () => {
          if(!this._player.dashing) {
            this._player.framesDashing = 0;
            this._player.dashing = true;
            this._player.velocity = BABYLON.Vector2.Zero();

            this._player.dashGhosts[0].position = this._player.sprite.position;
            this._player.dashGhosts[0].color.a = 1;
            this._player.dashGhosts[0].isVisible = true;
          }
        }
      )
    );


    // DEBUG BINDING DISABLE LATER
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "p"
        },
        () => {
          //console.log(this._towerBlocks);
          //console.log(this._disabledTowerBlocks)
        }
      )
    );
    
    // DEBUG BINDING DISABLE LATER
    this._scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        {
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "v"
        },
        () => {
          this._player.collisionMesh.isVisible = !this._player.collisionMesh.isVisible;
        }
      )
    );

    //setup update
    this._scene.onBeforeRenderObservable.add(()=>this.update());

    // Start music
    var tower = new BABYLON.Sound(
        "tower", "./Assets/Music/tower.wav", this._scene, null, {
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
    // player update section
    
    this._player.playerUpdate(this._playerInput.getDirection());

    // Scroll
    this._towerCoreTexture.vOffset += this._towerSpeed/4;

    // Camera follow player
    if(this._camera != null) {
      let c = this._camera.alpha % (2*Math.PI);
      let p = this._player.position.x;
      if( Math.abs(c - p) > Math.PI){
        c = (c+2*Math.PI - 0.1) % (2*Math.PI);
        p = (p+2*Math.PI - 0.1) % (2*Math.PI);
      }
      if(c > p + 0.1)
        this._camera.alpha -= (c - p)/15;
      else if(c < p - 0.1)
        this._camera.alpha -= (c - p)/15;
    }

    // update blocks
    this.updateBlocksList();
  }

  startCloud(): void {
    let fogTexture : BABYLON.Texture = new BABYLON.Texture("./Assets/Textures/smoke_15.png", this._scene);
    let particleSystem;
    particleSystem = new BABYLON.ParticleSystem("particles", 2500 , this._scene);
    particleSystem.manualEmitCount = particleSystem.getCapacity();
    particleSystem.minEmitBox = new BABYLON.Vector3(-25, 2, -25); // Starting all from
    particleSystem.maxEmitBox = new BABYLON.Vector3(25, 2, 25); // To...
    

    particleSystem.particleTexture = fogTexture.clone();
    var fountain = BABYLON.Mesh.CreateBox("foutain", .01, this._scene);
    fountain.position.y = -10;
    fountain.isVisible = false;
    particleSystem.emitter = fountain;
    
    particleSystem.color1 = new BABYLON.Color4(0.8, 0.8, 0.8, 0.1);
    particleSystem.color2 = new BABYLON.Color4(.95, .95, .95, 0.15);
    particleSystem.colorDead = new BABYLON.Color4(0.9, 0.9, 0.9, 0.1);
    particleSystem.minSize = 3.5;
    particleSystem.maxSize = 5.0;
    particleSystem.minLifeTime = 9007199254740991;
    particleSystem.emitRate = 1000;
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
  private towerBottom : number = -10;
  updateBlocksList() : void {
    this._towerBlocks.forEach((block, index) => {
      block.moveWithCollisions(new BABYLON.Vector3(0, -this._towerSpeed, 0));
      
      // if block is offscreen we disable 
      if(block.position.y < this.towerBottom){
        this._disabledTowerBlocks.push(block);
        block.isVisible = false;
        this._towerBlocks.splice(index, 1);
      }
    });

    // spawn new tower blocks
    if( this._disabledTowerBlocks.length > 0) {
      let BlockToPlace = this._disabledTowerBlocks.pop();
      BlockToPlace.isVisible = true;
      let x = this._player.position.x + (Math.random() - 0.5) * 4;
      let y = 10;
      BlockToPlace.position =  generatePointOnCircle(x, 12, y);
      BlockToPlace.lookAt(generatePointOnCircle(x, 14,y)); 
      this._towerBlocks.push(BlockToPlace);
    }
  }
}
/*
// if block is disabled 
      if(block.visibility === 0){
        
      }
*/

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
  public jump : keyInput;
  public special : keyInput;

  public getDirection () : BABYLON.Vector2 {
    let dir = new BABYLON.Vector2(0,0);
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