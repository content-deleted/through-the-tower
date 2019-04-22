///<reference path="babylon.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
//application data
var palletes = [];
var currentPallet = 0;
var Title = /** @class */ (function () {
    function Title(canvasElement) {
        this._TitleSprites = [];
        // Create canvas and engine.
        this._canvas = document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
    }
    Title.prototype.createScene = function () {
        var _this = this;
        // Create a basic BJS Scene object.
        this._scene = new BABYLON.Scene(this._engine);
        // Parameters: alpha, beta, radius, target position, scene
        this._camera = new BABYLON.ArcRotateCamera("mainCam", 0, Math.PI / 2, 30, new BABYLON.Vector3(0, 0, 0), this._scene);
        // Attach the camera to the canvas.
        this._camera.attachControl(this._canvas, false);
        this._camera.inputs.clear();
        // Create a basic light, aiming 0,1,0 - meaning, to the sky.
        var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), this._scene);
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
        // setup fade manager
        this._fade = new fadeManager(0.005, function () {
            _this._engine.runRenderLoop(function () { });
            _this._engine.stopRenderLoop();
            _this._scene.dispose();
            _this._engine.dispose();
            palletes.forEach(function (p) { return p.dispose(); });
            palletes = [];
            //setTimeout(function() {
            var game = new Game('renderCanvas');
            // Create the scene.
            game.createScene();
            // Start render loop.
            game.doRender();
            //}, 500);
        });
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
        Fade.onApply = function (effect) {
            effect.setFloat("Fade", _this._fade.current);
        };
        this.startCloud();
        this._scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction({
            trigger: BABYLON.ActionManager.OnKeyDownTrigger,
            parameter: "j"
        }, function () {
            _this._fade.running = true;
        }));
        // Generate title text
        var spriteManagerTitle = new BABYLON.SpriteManager("playerManager", "Assets/Sprites/Title.png", 26, { width: 64, height: 64 }, this._scene);
        var indexes = ['T', 'O', 'W', 'E', 'R', 'H', 'U', 'G', ' '];
        var createWords = function (letter) {
            var sprit = new BABYLON.Sprite("Letter", spriteManagerTitle);
            sprit.cellIndex = indexes.indexOf(letter);
            sprit.size = 4;
            _this._TitleSprites.push(sprit);
        };
        ['T', 'H', 'R', 'O', 'U', 'G', 'H', ' ', ' ', 'T', 'H', 'E', ' ', ' ', 'T', 'O', 'W', 'E', 'R', ' ', ' ', ' ', ' '].forEach(function (l) { return createWords(l); });
        //setup update
        this._scene.onBeforeRenderObservable.add(function () { return _this.update(); });
        // Start music
        var intro = new BABYLON.Sound("intro", "./Assets/Music/intro.wav", this._scene, null, {
            loop: true,
            autoplay: true //change to play 
        });
    };
    Title.prototype.doRender = function () {
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
    Title.prototype.update = function () {
        var _this = this;
        if (this._camera != null) {
            this._camera.alpha += 0.01;
            // update the letters
            this._TitleSprites.forEach(function (letter, index) {
                letter.position = generatePointOnCircle(2 * Math.PI / _this._TitleSprites.length * index, 13, 2 + Math.sin(_this._camera.alpha * 6 + index));
            });
        }
        this._fade.update();
    };
    Title.prototype.startCloud = function () {
        var fogTexture = new BABYLON.Texture("./Assets/Textures/smoke_15.png", this._scene);
        var particleSystem;
        particleSystem = new BABYLON.ParticleSystem("particles", 2500, this._scene);
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
    };
    return Title;
}());
window.addEventListener('DOMContentLoaded', function () {
    // Create the game using the 'renderCanvas'.
    var title = new Title('renderCanvas');
    document.addEventListener('keydown', function (event) {
        if (event.key === '1')
            currentPallet = (currentPallet + 1) % palletes.length;
    });
    // Create the scene.
    title.createScene();
    // Start render loop.
    title.doRender();
});
var fadeManager = /** @class */ (function () {
    function fadeManager(increment, faded) {
        this.running = false;
        this.current = 1.0;
        this.increment = increment;
        this.callback = faded;
    }
    fadeManager.prototype.update = function () {
        if (this.running && this.current >= 0) {
            this.current -= this.increment;
            if (this.current < 0) {
                this.callback();
            }
        }
    };
    return fadeManager;
}());
var towerObject = /** @class */ (function () {
    function towerObject(position, radius, sprite, scene) {
        this.grounded = false;
        this.position = position;
        this.radius = radius;
        this.sprite = sprite;
        this.collisionMesh = BABYLON.BoxBuilder.CreateBox("BoxCollider", { size: 2 }, scene);
        this.collisionMesh.checkCollisions = true;
        this.collisionMesh.isVisible = false;
        this.update();
        this.collisionMesh.position = this.sprite.position;
        this.velocity = new BABYLON.Vector2;
    }
    towerObject.prototype.update = function () {
        this.sprite.position = this.getLocalPosition(this.position);
        this.collisionMesh.position = this.sprite.position;
        this.collisionMesh.lookAt(generatePointOnCircle(this.position.x % (2 * Math.PI), this.radius + 2, this.position.y));
    };
    towerObject.prototype.getLocalPosition = function (pos) {
        return generatePointOnCircle(pos.x % (2 * Math.PI), this.radius, pos.y);
    };
    towerObject.prototype.updateGamePosition = function (dir) {
        var tempY = this.position.y;
        dir = dir.add(this.velocity);
        this.velocity = this.velocity.scale(0.95);
        var temp = this.getLocalPosition(this.position.add(dir));
        //update colider
        this.collisionMesh.moveWithCollisions(temp.subtract(this.sprite.position));
        //update tower position
        var temp2 = generateCylindricalPoint(this.collisionMesh.position);
        this.position = new BABYLON.Vector2(temp2[0], temp2[2]);
        this.update();
        // correct for moving blocks
        this.grounded = (tempY + dir.y + 0.1 <= this.position.y);
        if (!this.grounded && dir.y > 0 && tempY + dir.y - 0.1 > this.position.y) {
            this.velocity.y = 0;
            this.position.y -= 0.2;
            this.update();
        }
    };
    return towerObject;
}());
var playerManager = /** @class */ (function (_super) {
    __extends(playerManager, _super);
    function playerManager(position, radius, spriteMan, scene, size) {
        var _this = _super.call(this, position, radius, new BABYLON.Sprite("player", spriteMan), scene) || this;
        _this.dashing = false;
        _this.dashDirection = new BABYLON.Vector2();
        _this.framesDashing = 0;
        _this.sprite.size *= size;
        _this.dashGhosts = [];
        for (var i = 0; i < 5; i++) {
            _this.dashGhosts.push(new BABYLON.Sprite("ghost", spriteMan));
            _this.dashGhosts[i].color.a = 0;
            _this.dashGhosts[i].size *= size;
        }
        return _this;
    }
    playerManager.prototype.playerUpdate = function (inputDir) {
        if (this.dashing) {
            inputDir = this.dashDirection;
            inputDir.scaleInPlace(this.dashSpeed);
            inputDir.y *= 3.4;
            // update dash effect
            if (this.framesDashing < 8 && this.framesDashing % 2 == 0) {
                this.dashGhosts[1 + this.framesDashing / 2].position = this.sprite.position;
                this.dashGhosts[1 + this.framesDashing / 2].color.a = 1;
            }
            this.framesDashing++;
            // check if end of dash
            if (this.framesDashing > this.dashLength) {
                this.dashing = false;
                this.framesCooldown = 0;
            }
        }
        else {
            if (inputDir.length() > 0)
                this.dashDirection.copyFrom(inputDir);
            inputDir.x *= 0.01;
            this.framesCooldown++;
            if (this.framesCooldown > this.cooldownLength)
                inputDir.y = -0.2; //apply gravity
            else {
                inputDir.y = -0.2 * this.framesCooldown / this.cooldownLength;
            }
        }
        // sprite dir
        if (inputDir.x != 0) {
            if (inputDir.x > 0)
                this.sprite.invertU = 1;
            else
                this.sprite.invertU = 0;
        }
        this.updateGamePosition(inputDir);
        this.dashGhosts.forEach(function (g) { return g.color.a -= 0.05; });
    };
    return playerManager;
}(towerObject));
function generatePointOnCircle(X, radius, y) {
    var x = Math.cos(X) * radius;
    var z = Math.sin(X) * radius;
    return new BABYLON.Vector3(x, y, z);
}
function generateCylindricalPoint(v) {
    var angle = Math.atan2(v.z, v.x);
    var radius = Math.sqrt(v.x * v.x + v.z * v.z);
    var height = v.y;
    if (angle < 0)
        angle = 2 * Math.PI + angle; //dumb correction
    return [angle, radius, height];
}
