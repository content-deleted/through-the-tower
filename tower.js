///<reference path="babylon.d.ts" />
var Game = /** @class */ (function () {
    function Game(canvasElement) {
        this._disabledTowerBlocks = [];
        this._towerSpeed = 0.02;
        this.towerBottom = -10;
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement);
        console.log("StartingMainGameLoop");
        this._engine = new BABYLON.Engine(this._canvas, true);
    }
    Game.prototype.createScene = function () {
        var _this = this;
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        //Physics?
        //this._scene.enablePhysics(new BABYLON.Vector3(0, -9.8,0));
        this._scene.gravity = new BABYLON.Vector3(0, -0.9, 0);
        // Enable Collisions
        this._scene.collisionsEnabled = true;
        // Parameters: alpha, beta, radius, target position, scene
        this._camera = new BABYLON.ArcRotateCamera("mainCam", 0, Math.PI / 2, 25, new BABYLON.Vector3(0, 0, 0), this._scene);
        // Attach the camera to the canvas.
        this._camera.attachControl(this._canvas, false);
        this._camera.inputs.clear();
        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        this._light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
        // Create a built-in "sphere" shape; with 16 segments and diameter of 2.
        var _towerCore = BABYLON.MeshBuilder.CreateCylinder("TowerCore", { height: 40, diameter: 20, tessellation: 8, subdivisions: 5 }, this._scene);
        //_towerCore.physicsImpostor = new BABYLON.PhysicsImpostor(_towerCore,BABYLON.PhysicsImpostor.CylinderImpostor, {mass: 0, restitution: 0.9 }, this._scene);
        _towerCore.checkCollisions = true;
        var brickMat = new BABYLON.StandardMaterial("brick", this._scene);
        this._towerCoreTexture = new BABYLON.Texture("./Assets/Textures/brick.png", this._scene);
        this._towerCoreTexture.uScale = 10;
        this._towerCoreTexture.vScale = 10;
        brickMat.diffuseTexture = this._towerCoreTexture;
        _towerCore.material = brickMat;
        var blockTex = new BABYLON.Texture("./Assets/Textures/brick.png", this._scene);
        var blockMat = new BABYLON.StandardMaterial("block", this._scene);
        blockMat.diffuseTexture = blockTex;
        this._towerBlocks = [];
        for (var i = 0; i < 30; i++) {
            var b = BABYLON.BoxBuilder.CreateBox("Block", { size: 2.5 }, this._scene);
            var x = 2 * Math.PI / 10 * i + Math.floor(i / 10) * 5;
            var y = Math.floor(i / 10) * 6 - 8;
            b.position = generatePointOnCircle(x, 12, y);
            b.lookAt(generatePointOnCircle(x, 14, y));
            //b.physicsImpostor = new BABYLON.PhysicsImpostor(b, BABYLON.PhysicsImpostor.BoxImpostor, {mass:0, restitution: 0.9}, this._scene);
            b.checkCollisions = true;
            b.material = blockMat;
            this._towerBlocks.push(b);
        }
        // Setup
        this._scene.actionManager = new BABYLON.ActionManager(this._scene);
        this._playerInput = new PlayerInput(this._scene);
        //setup pp
        var palletteEffect = new BABYLON.PostProcess("retro", "./Assets/Effects/retroClamp", ["screenSize", "colorPrecision"], ["pallete"], 0.15, this._camera);
        palletes.push(new BABYLON.Texture("./Assets/Effects/paletteGB.png", this._scene));
        palletes.push(new BABYLON.Texture("./Assets/Effects/paletteBerry.png", this._scene));
        palletes.push(new BABYLON.Texture("./Assets/Effects/paletteLolipop.png", this._scene));
        palletes.push(new BABYLON.Texture("./Assets/Effects/paletteSepia.png", this._scene));
        palletteEffect.onApply = function (effect) {
            effect.setFloat2("screenSize", palletteEffect.width, palletteEffect.height);
            effect.setTexture("pallete", palletes[currentPallet]);
            effect.setFloat("colorPrecision", 8);
        };
        var Fade = new BABYLON.PostProcess("fade", "./Assets/Effects/fade", ["Fade"], null, 1, this._camera);
        var brightAmount = 1;
        Fade.onApply = function (effect) {
            effect.setFloat("Fade", brightAmount);
        };
        this.startCloud();
        //
        var spriteManagerPlayer = new BABYLON.SpriteManager("playerManager", "Assets/Sprites/Player.png", 4, { width: 64, height: 64 }, this._scene);
        this._player = new towerObject(new BABYLON.Vector2(0, 0), 13, new BABYLON.Sprite("player", spriteManagerPlayer), this._scene);
        this._player.sprite.size *= 3;
        this._player.sprite.playAnimation(0, 3, true, 100, function () { });
        this._scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "j"
        }, function () {
            if (_this._player.grounded)
                _this._player.velocity.y = 0.75;
        }));
        // DEBUG BINDING DISABLE LATER
        this._scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "p"
        }, function () {
            //console.log(this._towerBlocks);
            //console.log(this._disabledTowerBlocks)
        }));
        // DEBUG BINDING DISABLE LATER
        this._scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "v"
        }, function () {
            _this._player.collisionMesh.isVisible = !_this._player.collisionMesh.isVisible;
        }));
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
        var tempY = this._player.position.y;
        // player update section
        var dir = this._playerInput.getDirection();
        dir.x *= 0.01;
        dir.y *= 0.4;
        dir.y -= 0.2; //apply gravity
        dir = dir.add(this._player.velocity);
        this._player.velocity = this._player.velocity.scale(0.95);
        var temp = this._player.getLocalPosition(this._player.position.add(dir));
        //update player colider
        this._player.collisionMesh.moveWithCollisions(temp.subtract(this._player.sprite.position));
        //update player
        var temp2 = generateCylindricalPoint(this._player.collisionMesh.position);
        this._player.position = new BABYLON.Vector2(temp2[0], temp2[2]);
        this._player.update();
        this._player.grounded = (tempY + dir.y + 0.1 <= this._player.position.y);
        if (!this._player.grounded && dir.y > 0 && tempY + dir.y - 0.1 > this._player.position.y) {
            this._player.velocity.y = 0;
            this._player.position.y -= 0.2;
            this._player.update();
            console.log("bump");
        }
        // Scroll
        this._towerCoreTexture.vOffset += this._towerSpeed / 4;
        // Camera follow player
        if (this._camera != null) {
            var c = this._camera.alpha % (2 * Math.PI);
            var p = this._player.position.x;
            if (Math.abs(c - p) > Math.PI) {
                c = (c + 2 * Math.PI - 0.1) % (2 * Math.PI);
                p = (p + 2 * Math.PI - 0.1) % (2 * Math.PI);
            }
            if (c > p + 0.1)
                this._camera.alpha -= (c - p) / 15;
            else if (c < p - 0.1)
                this._camera.alpha -= (c - p) / 15;
        }
        // update blocks
        this.updateBlocksList();
    };
    Game.prototype.startCloud = function () {
        var fogTexture = new BABYLON.Texture("./Assets/Textures/smoke_15.png", this._scene);
        var particleSystem;
        particleSystem = new BABYLON.ParticleSystem("particles", 2500, this._scene);
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
    };
    Game.prototype.updateBlocksList = function () {
        var _this = this;
        this._towerBlocks.forEach(function (block, index) {
            block.position.y -= _this._towerSpeed;
            // if block is offscreen we disable 
            if (block.position.y < _this.towerBottom) {
                _this._disabledTowerBlocks.push(block);
                block.isVisible = false;
                _this._towerBlocks.splice(index, 1);
            }
        });
        // spawn new tower blocks
        if (this._disabledTowerBlocks.length > 0) {
            var BlockToPlace = this._disabledTowerBlocks.pop();
            BlockToPlace.isVisible = true;
            var x = this._player.position.x + (Math.random() - 0.5) * 4;
            var y = 10;
            BlockToPlace.position = generatePointOnCircle(x, 12, y);
            BlockToPlace.lookAt(generatePointOnCircle(x, 14, y));
            this._towerBlocks.push(BlockToPlace);
        }
    };
    return Game;
}());
/*
// if block is disabled
      if(block.visibility === 0){
        
      }
*/
var keyInput = /** @class */ (function () {
    function keyInput(key, onPress, onRelease, scene) {
        var _this = this;
        this.key = key;
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: key
        }, function () { _this.isDown = true; onPress(); }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyUpTrigger,
            parameter: key
        }, function () { _this.isDown = false; onRelease(); }));
    }
    return keyInput;
}());
var PlayerInput = /** @class */ (function () {
    function PlayerInput(scene) {
        this.up = new keyInput('w', function () { }, function () { }, scene);
        this.down = new keyInput('s', function () { }, function () { }, scene);
        this.left = new keyInput('a', function () { }, function () { }, scene);
        this.right = new keyInput('d', function () { }, function () { }, scene);
    }
    PlayerInput.prototype.getDirection = function () {
        var dir = new BABYLON.Vector2(0, 0);
        if (this.up.isDown)
            dir.y += 1;
        if (this.down.isDown)
            dir.y -= 1;
        if (this.left.isDown)
            dir.x -= 1;
        if (this.right.isDown)
            dir.x += 1;
        return dir.normalize();
    };
    return PlayerInput;
}());
/*
we want to use this later to render holes in the tower
var sphereCSG = BABYLON.CSG.FromMesh(sphere);
var cylinderCSG = BABYLON.CSG.FromMesh(cylinder);
sphereCSG.subtractInPlace(cylinderCSG);
var ball = sphereCSG.toMesh("test", sphere.material, scene, false);

*/ 
