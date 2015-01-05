/**
 * 2048 Javascript game by Evan Fossier
 * A summer + winter break 2014 project
 */

// Define constants
var CELL_WIDTH = 100;
var OFFSET = 5; //offset from any edge of the canvas
var CELL_FONT = " Arial Black"; //The font used to draw the numbers in the cells

// Global variables
var board; // 2D array holding the game board data
var c; // the canvas element
var drawer; //the canvas drawer
var N; // the game board size in number of cells
var score; // The current score
var numMoves; //The number of moves player has made
var gameWon; //Boolean true if the game is over and the player won, initialized to false
var gameLost; //Boolean true if game is over and player lost, initialized to false.

// Contains all the info for cell colors, number colors and sizes
var colors = {
    "-1":{
        border: "#bbada0",
        fill: "#ccc0b3"
    },
    "2":{
        border: "#ded8d2",
        fill: "#eee4da",
        fontSize: "26pt",
        numColor: "#776e65"
    },
    "4":{
        border: "#d2c8b4",
        fill: "#ede0c8",
        fontSize: "26pt",
        numColor: "#776e65"
    },
    "8":{
        border: "#dc975c",
        fill: "#f2b179",
        fontSize: "26pt",
        numColor: "white"
    },
    "16":{
        border: "#d47747",
        fill: "#f59563",
        fontSize: "23pt",
        numColor: "white"
    },
    "32":{
        border: "#e46548",
        fill: "#f77d62",
        fontSize: "23pt",
        numColor: "white"
    },
    "64":{
        border: "#de4927",
        fill: "#f75d3a",
        fontSize: "23pt",
        numColor: "white"
    },
    "128":{
        border:"#daaf34",
        fill:"#eec652",
        fontSize: "20pt",
        numColor: "white"
    },
    "256":{
        border:"#c89c1f",
        fill:"#efc242",
        fontSize: "20pt",
        numColor: "white"
    },
    "512":{
        border:"#cea50e",
        fill:"#e7be29",
        fontSize: "20pt",
        numColor: "white"
    },
    "1024":{
        border:"#ca3f45",
        fill:"#ef656b",
        fontSize: "18pt",
        numColor: "white"
    },
    "2048":{
        border:"#c82e2b",
        fill:"#ef3d3a",
        fontSize: "18pt",
        numColor: "white"
    }
};

// Cross browser animation frame
window.requestAnimFrame = (function(callback) {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
      })();

// Initialize the canvas once the page is done loading
$(document).ready(function(){
    c = document.getElementById("main");
    drawer = c.getContext("2d");

    // Draw the splash screen image
    var img = new Image();
    img.src = "splash.png";
    img.onload = function(){
        console.log("image loaded");
        drawer.drawImage(img, 0, 0, c.width, c.height);
    }

    $("#playbutton").text("Play");
    $("#playbutton").removeAttr("disabled");
});

/*
    Called when the play button is pressed, starts loading the game
 */
function play(){
    console.log("Loading game");
    // Change play button to the restart button
    $("#playbutton").attr("onclick","restart()");
    $("#playbutton").text("Restart");

    // Disable the size dropdown
    $("#boardsizedropdown").attr("disabled", "true");
    
    var size = parseInt($("#boardsizedropdown").val());
    console.log("Board size set to: "+size);
    initialize(size);
}

/*
    Creates the game data for a new game and starts rendering
 */
function initialize(n){
    console.log("Initializing, n="+n);

    // Resize the canvas first
    c.width = (3*OFFSET) + (n*CELL_WIDTH);
    c.height = c.width + 70 - OFFSET;

    N = n;
    console.log(N);
    score = 0;
    numMoves = 0;
    gameWon = false;
    gameLost = false;
    board = [];

    var x = OFFSET; //Leave border with edge of canvas
    var y = OFFSET; //Leave border with edge of canvas
    for(var row=0; row<n; row++){
        var rowContents = [];
        for(var col=0; col<n; col++){
            var newSquare = new Square(x,y,row,col);
            rowContents.push(newSquare);
            x += CELL_WIDTH;
        }
        board.push(rowContents);
        x = OFFSET; //Reset to beginning of row
        y = y + CELL_WIDTH;
    }

    initStartTiles();
    renderBoard();

    // Scroll board into view
    $('html, body, .content').animate({scrollTop: $(document).height()}, 1500);
}

/*
    Picks two positions at random for the 2 first number tiles and places them on the board
 */
function initStartTiles(){
    var r1 = Math.floor((Math.random()*N));
    var c1 = Math.floor((Math.random()*N));

    // generate second cell but ensure its not he same as the first cell
    var r2 = r1;
    var c2 = c1;
    while(r2 === r1 && c2 == c1){
        r2 = Math.floor((Math.random()*N));
        c2 = Math.floor((Math.random()*N));
    }

    console.log("Start tile locations:");
    console.log("("+r1+","+c1+")");
    console.log("("+r2+","+c2+")");


    board[r1][c1].setVal(2);
    board[r2][c2].setVal(2);
    // Start anims
    board[r1][c1].startSpawnAnim();
    board[r2][c2].startSpawnAnim();
}

/*
    Restarts the game with the same parameters
 */
function restart(){
    score = 0;
    numMoves = 0;
    gameWon = false;
    gameLost = false;
    keypressDelayActive = false;
    // Reset all elems in board to -1
    for(var r=0; r<N; r++){
        for(var c=0; c<N; c++){
            board[r][c].setVal(-1);
            board[r][c].merged = false;
        }
    }
    drawer.clearRect(0, 0, c.width, c.height);
    initStartTiles();
    renderBoard();
    console.log("Game restarted");
}

/*
    CLASS
    Square object can hold any value, created with x,y coords in pixels and row,col in the game board grid.
 */
function Square(x,y,row, col){
    this.x = x;
    this.y = y;
    this.row = row;
    this.col = col;
    this.isMoving = false;
    this.oldVal = -1;
    this.isSpawning = false;
    this.animDuration = 150; //in ms
    this.animStartTime = 0;
    this.val = -1; //start out as empty
    this.merged = false; //wether square was merged this turn
    this.replaceVal = -1; //The value this square replaces wen it moves down, ie the square which it is taking the place of
    this.adjustedAnimSpeed = -1; //whether we have calculated appropriate anim speed for num squares to mvoe

    // Set val
    this.setVal = function(newVal){
        this.val = newVal;
    };

    // Set new row/col
    this.setGrid = function(newR, newC){
        this.row = newR;
        this.col = newC;
    };

    // Set x,y coords
    this.setCoord = function(newX, newY){
        this.x = newX;
        this.y = newY;
    };

    // Renders the square with appropriate color for stored x,y.
    // This is the master render function, depending on the situation it will call the renderSpawn or renderMove functions
    // This function has no animations, it just draws the square object at this.x and this.y
    // renderSpawn & renderMove handle animations.
    // force: boolean, decides if we frce the regular render which has no animation or if we use the movement animation
    this.render = function(force){
        // if(this.val !== -1){
        //     console.log("Rendering square ("+this.row+","+this.col+") at coords ("+this.x+","+this.y+") val="+this.val);
        // }

        // If render called without parameters then force defaults to false
        force = typeof force !== 'undefined' ? force : false;
        // if(force){
        //     console.log("FORCING REG RENDER");
        // }

        if(this.isSpawning && !force){
            this.renderSpawn();
        }
        else if(this.isMoving && !force){
            this.renderMove();
        }
        else{ //Normal render
            drawer.clearRect(this.x, this.y, CELL_WIDTH, CELL_WIDTH);
            var borderColor = colors[this.val.toString()].border;
            var fillColor = colors[this.val.toString()].fill;

            // Draw background with given colors
            drawer.beginPath();
            drawer.rect(this.x,this.y,CELL_WIDTH,CELL_WIDTH);
            drawer.fillStyle = borderColor;
            drawer.fill();
            drawer.lineWidth = 2;
            drawer.strokeStyle = "black";
            drawer.stroke();

            drawer.beginPath();
            drawer.rect(this.x+5, this.y+5, CELL_WIDTH-10, CELL_WIDTH-10);
            drawer.fillStyle= fillColor;
            drawer.fill();

            // Draw number, not empty spaces (-1)
            if(this.val > 0){
                drawer.beginPath();
                // console.log("Drawing num");
                var midX = this.x + Math.floor(CELL_WIDTH/2);
                var midY = this.y + Math.floor(CELL_WIDTH/2);
                var font = CELL_FONT;
                var fontSize = colors[this.val.toString()].fontSize;
                font = fontSize + font;
                drawer.font=font;
                drawer.fillStyle = colors[this.val.toString()].numColor;
                drawer.strokeStyle = "black";
                drawer.lineWidth = 1;
                drawer.textBaseline = "middle";
                drawer.textAlign = "center";
                drawer.fillText(this.val, midX, midY);
                // console.log("Done drawing for row="+this.row+", col="+this.col)
            }
        }
    };

    this.renderSpawn = function(){
        var time = (new Date()).getTime() - this.animStartTime;
        if(time >= this.animDuration){
            // Exit spawn anim
            this.isSpawning = false;
            this.render();
        }else{
            // First render old square below it
            var borderColor = colors[this.val.toString()].border;
            var fillColor = colors[this.val.toString()].fill;

            drawer.beginPath();
            drawer.rect(this.x,this.y,CELL_WIDTH,CELL_WIDTH);
            drawer.fillStyle = borderColor;
            drawer.fill();
            drawer.lineWidth = 2;
            drawer.strokeStyle = "black";
            drawer.stroke();

            drawer.beginPath();
            drawer.rect(this.x+5, this.y+5, CELL_WIDTH-10, CELL_WIDTH-10);
            drawer.fillStyle= fillColor;
            drawer.fill();

            // Then render growing square
            borderColor = colors[this.val.toString()].border;
            fillColor = colors[this.val.toString()].fill;

            // Adjust x/y values to have it grow from center
            var newX = (1-(time / this.animDuration))*(CELL_WIDTH/2) + this.x;
            var newY = (1-(time / this.animDuration))*(CELL_WIDTH/2) + this.y;
            var newWidth = Math.max((time/this.animDuration)*CELL_WIDTH, 1);
            
            // Draw background with given colors
            drawer.beginPath();
            drawer.rect(newX,newY,newWidth,newWidth);
            drawer.fillStyle = borderColor;
            drawer.fill();
            drawer.lineWidth = 2;
            drawer.strokeStyle = "black";
            drawer.stroke();
            // Draw interior if big enough
            if(newWidth > 10){
                drawer.beginPath();
                drawer.rect(newX+5, newY+5, newWidth-10, newWidth-10);
                drawer.fillStyle= fillColor;
                drawer.fill();   
            }
        }
    }

    this.renderMove = function(){
        var time = (new Date()).getTime() - this.animStartTime;
        if(this.adjustedAnimSpeed !== -1 && time >= this.adjustedAnimSpeed){
            // Exit move anim
            this.isMoving = false;
            this.adjustedAnimSpeed = -1;
            // console.log("IMPORTANT: EXITING MOVE ANIM");
            this.render(true);
            return;
        }
        // Render empty square underneath
        var borderColor = colors[this.replaceVal.toString()].border;
        var fillColor = colors[this.replaceVal.toString()].fill;
        // console.log("Rendering under square at x "+this.x+", y "+this.y);

        drawer.beginPath();
        drawer.rect(this.x,this.y,CELL_WIDTH,CELL_WIDTH);
        drawer.fillStyle = borderColor;
        drawer.fill();
        drawer.lineWidth = 2;
        drawer.strokeStyle = "black";
        drawer.stroke();

        drawer.beginPath();
        drawer.rect(this.x+5, this.y+5, CELL_WIDTH-10, CELL_WIDTH-10);
        drawer.fillStyle = fillColor;
        drawer.fill();

        // Draw number, not empty spaces (-1)
        if(this.replaceVal > 0){
            drawer.beginPath();
            // console.log("Drawing num");
            var midX = this.x + Math.floor(CELL_WIDTH/2);
            var midY = this.y + Math.floor(CELL_WIDTH/2);
            var font = CELL_FONT;
            var fontSize = colors[this.replaceVal.toString()].fontSize;
            font = fontSize + font;
            drawer.font=font;
            drawer.fillStyle = colors[this.val.toString()].numColor;
            drawer.strokeStyle = "black";
            drawer.lineWidth = 1;
            drawer.textBaseline = "middle";
            drawer.textAlign = "center";
            drawer.fillText(this.replaceVal, midX, midY);
            // console.log("Done drawing for row="+this.row+", col="+this.col)
        }

        // calculate speed based on number of squares to move
        if(this.adjustedAnimSpeed === -1){
            var numSquares = 1;
            if((this.y - this.origY) !== 0){
                numSquares = Math.abs(this.y - this.origY) / CELL_WIDTH;
            }else{
                numSquares = Math.abs(this.x - this.origY) / CELL_WIDTH;
            }
            this.adjustedAnimSpeed = this.animDuration + 50*(numSquares-1);
            // console.log("num squares to move: "+numSquares);
        }
        // console.log("Anim duration: "+this.adjustedAnimSpeed);

        // Set directions;
        var dx = (this.x - this.origX)*(time / this.adjustedAnimSpeed);
        var dy = (this.y - this.origY)*(time / this.adjustedAnimSpeed);
        // console.log("dx "+dx);
        // console.log("dy "+dy);
        var newX;
        var newY;
        // Make sure square doesnt move beyond its rightful place
        if(dy > 0){
            newX = Math.min(this.origX + dx, this.x);
            newY = Math.min(this.origY + dy, this.y);
        }else if(dy < 0){
            newX = Math.max(this.origX + dx, this.x);
            newY = Math.max(this.origY + dy, this.y);
        }

        if(dx > 0){
            newX = Math.min(this.origX + dx, this.x);
            newY = Math.min(this.origY + dy, this.y);
        }else if(dx < 0){
            newX = Math.max(this.origX + dx, this.x);
            newY = Math.max(this.origY + dy, this.y);
        }

        // console.log("newX "+newX);
        // console.log("newY "+newY);

        // Clear above where we are about to draw
        drawer.clearRect(newX, newY, CELL_WIDTH, CELL_WIDTH);

        borderColor = colors[this.val.toString()].border;
        fillColor = colors[this.val.toString()].fill;

        // Draw square
        drawer.beginPath();
        drawer.rect(newX,newY,CELL_WIDTH,CELL_WIDTH);
        drawer.fillStyle = borderColor;
        drawer.fill();
        drawer.lineWidth = 2;
        drawer.strokeStyle = "black";
        drawer.stroke();

        drawer.beginPath();
        drawer.rect(newX+5, newY+5, CELL_WIDTH-10, CELL_WIDTH-10);
        drawer.fillStyle= fillColor;
        drawer.fill();

        // Draw text
        if(this.val > 0){
            // console.log("Drawing num");
            var midX = newX + Math.floor(CELL_WIDTH/2);
            var midY = newY + Math.floor(CELL_WIDTH/2);
            var font = CELL_FONT;
            var fontSize = colors[this.val.toString()].fontSize;
            font = fontSize + font;
            drawer.font=font;
            drawer.fillStyle = colors[this.val.toString()].numColor;
            drawer.strokeStyle = "black";
            drawer.lineWidth = 1;
            drawer.textBaseline = "middle";
            drawer.textAlign = "center";
            drawer.fillText(this.val, midX, midY);
            // console.log("Done drawing for row="+this.row+", col="+this.col)
        }

    }

    this.startSpawnAnim = function(){
        this.animStartTime = new Date().getTime();
        this.isSpawning = true;
    }

    this.startMove = function(replacementVal, oldVal, oldX, oldY){
        this.replaceVal = replacementVal;
        this.animStartTime = new Date().getTime();
        this.isMoving = true;
        this.origX = oldX;
        this.origY = oldY;
        this.oldVal = oldVal;
    }
}

/*
    Picks an empty spot and spawns either a 2 with prob 4/5, 4 with prob 1/5;
 */
function spawnSquare(){
    // console.log("Spawning a square") ;
    var spawnVal = (Math.random() < 0.8) ? 2 : 4;

    // Find all empty squares
    var emptySquares = [];
    for(var row=0; row<N; row++){
        for(var col=0; col<N; col++){
            var curSquare = board[row][col];
            if(curSquare.val === -1){
                emptySquares.push(curSquare);
            }
        }
    }

    // Select a random empty square to change value
    var spawnIdx = Math.floor(Math.random()*emptySquares.length);
    var spawnSquare = emptySquares[spawnIdx];
    spawnSquare.setVal(spawnVal);
    spawnSquare.startSpawnAnim();
    // console.log("Spawned at ("+spawnSquare.row+","+spawnSquare.col+").");
}

/*
    Checks if the game is won
 */
function checkWin(){
    for(var row=0; row < N; row++){
        for(var col=0; col<N; col++){
            var curSquare = board[row][col];
            if(curSquare.val === 2048){
                // console.log("Game Won!");
                gameWon = true;
                return true;
            }
        }
    }
    return false;
}

/*
    Checks if game is lost by traversing every square and checking if any has either an empty value next to it or a merge possible
 */
function checkLoss(){
    // console.log("Checking if board is lost.");
    for(var row=0;row<N;row++){
        for(var col=0; col<N; col++){
            var curSquare = board[row][col];

            if (curSquare.val === -1){
                // console.log("Found an empty square");
                return false;
            }

            var adjSquare;
            // Check square above
            if(row > 0){
                adjSquare = board[row-1][col];
                if(adjSquare.val === -1 || curSquare.val === adjSquare.val){ //Move is possible
                    // console.log("Move up possible.");
                    return false;
                }
            }

            // Check square below
            if(row < (N-1)){
                adjSquare = board[row+1][col];
                if(adjSquare.val === -1 || curSquare.val === adjSquare.val){ //Move is possible
                    // console.log("Move down possible.");
                    return false;
                }
            }

            // Check square to right
            if(col < (N-1)){
                adjSquare = board[row][col+1];
                if(adjSquare.val === -1 || curSquare.val === adjSquare.val){ //Move is possible
                    // console.log("Move right possible.");
                    return false;
                }
            }

            // Check square to left
            if(col > 0){
                adjSquare = board[row][col-1];
                if(adjSquare.val === -1 || curSquare.val === adjSquare.val){ //Move is possible
                    // console.log("Move left possible.");
                    return false;
                }
            }
        }
    }
    // console.log("***Game is lost");
    gameLost = true;
    return true;
}

function advanceTurn(){
    numMoves += 1;

    // Clear all merged flags in squares
    for(var row=0; row<N; row++){
        for (var col=0; col<N; col++){
            var curSquare = board[row][col];
            curSquare.merged = false;
        }
    }

    // Spawn new square
    spawnSquare();

    // Check for game over
    if(checkWin()) return true;
    if(checkLoss()) return true;
    return false;

}

/*
    Swaps coordinates of two square objects
 */
function swapCoords(square1, square2){
    // Swap coordinates
    var tempX = square1.x;
    var tempY = square1.y;
    square1.setCoord(square2.x, square2.y);
    square2.setCoord(tempX, tempY);
}

function drawRoundedRect(ctx,x,y,w,h,rad){
    // console.log("drawing rounded rectangle w/ width= "+w+", height="+h+", rad="+rad + " @ ("+x+","+y+")");
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.lineTo(x+w-rad,y); //top line
    ctx.quadraticCurveTo(x+w, y, x+w, y+rad); //top right corner
    ctx.lineTo(x+w,y+h-rad);
    ctx.quadraticCurveTo(x+w, y+h, x+w-rad, y+h); //bottom right corner
    ctx.lineTo(x+rad, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-rad); //bottom left corner
    ctx.lineTo(x, y+rad);
    ctx.quadraticCurveTo(x, y, x+rad,y); //top left corner
    ctx.closePath();
}

function renderScore(){
    // console.log("Drawing score & turns");
    drawer.font = "10pt" + CELL_FONT;

    // Draw scores rounded rectangle
    var x = OFFSET;
    var y = (OFFSET*3) + (CELL_WIDTH*N);
    var width = Math.max(drawer.measureText("SCORE").width+40,drawer.measureText(score.toString()).width+40);
    var height = 60;
    var rad = 7;

    drawRoundedRect(drawer,x,y,width,height,rad);
    drawer.fillStyle = colors["-1"].fill;
    drawer.strokeStyle = colors["-1"].border;
    drawer.lineWidth = 2;
    drawer.fill();
    drawer.stroke();

    // Draw the score text
    var midX = x + (width/2);
    drawer.fillStyle = "black";
    drawer.textBaseline = "middle";
    drawer.textAlign = "center";
    drawer.fillText("SCORE", midX, y+15);

    // Draw the score itself
    drawer.font = "17pt" + CELL_FONT;
    drawer.fillText(score.toString(), midX, y+40);

    // Draw the moves rectangle
    drawer.font = "10pt" + CELL_FONT;
    x = x + width + 15;
    width = Math.max(drawer.measureText("NUM MOVES").width+40,drawer.measureText(numMoves.toString()).width+40);
    drawRoundedRect(drawer, x, y, width, height, rad);
    drawer.fillStyle = colors["-1"].fill;
    drawer.fill();
    drawer.stroke();

    // Draw nummoves text
    midX = x + (width/2);

    drawer.fillStyle = "black";
    drawer.fillText("NUM MOVES", midX, y+15);

    // Draw nummoves itself
    drawer.font = "17pt" + CELL_FONT;
    drawer.fillText(numMoves.toString(), midX, y+40);
}


/*
    Renders all parts of the game;
    returns true if all squares are done with their animations otherwise returns false
 */
function renderBoard(){
    // console.log("Drawing "+N+"x"+N+" grid.");
    // console.log(board)

    var y = OFFSET;
    // Draw N horizontal lines
    for(var j=0; j<(N+1); j++){
        var x = OFFSET;
        // Draw one line
        for(var i=0; i<N; i++){
            // console.log("drawing segment ("+offset+","+height+")->("+(offset+CELL_WIDTH)+","+height+").");
            drawer.beginPath();
            drawer.moveTo(x,y);
            drawer.lineTo(CELL_WIDTH+x,y);
            drawer.stroke();
            x = x + CELL_WIDTH;
        }
       
        drawer.beginPath();
        
        y = y + CELL_WIDTH;
    }

    // Draw N vertical lines
    var x = OFFSET;
    // Go through columns
    for(var k=0; k<(N+1);k++){
        var y = OFFSET;
        // Draw one vertical line, go through rows
        for(var l=0; l<N;l++){
            drawer.beginPath();
            drawer.moveTo(x, y);
            drawer.lineTo(x, y+CELL_WIDTH);
            drawer.stroke();
            // Draw empty square contents
            if(k < N){
                var curSquare = board[l][k];
                curSquare.setCoord(x,y);
                if(curSquare.val === -1){
                    curSquare.render();
                }
            }
            y = y + CELL_WIDTH;
        }
        x = x + CELL_WIDTH;
    }

    // Draw non empty squares after.
    var isAnimating = false;
    for(var r=0; r<N; r++){
        for(var c=0; c<N; c++){
            var curSquare = board[r][c];
            if(curSquare.val !== -1){
                curSquare.render();
            }
            if(curSquare.isMoving || curSquare.isSpawning){
                isAnimating = true;
            }
        }
    }

    renderScore();
    // console.log("Done rendering All");
    // console.log(board);
    // console.log("------------");

    // make call to render another frame if any square is still animating
    if(isAnimating){
        requestAnimFrame(function(){
            renderBoard();
        });
        return false;
    }
    // If we reach this point then animations are done
    if(gameWon){
        renderGameOver("win");
    }
    else if(gameLost){
        renderGameOver("loss");
    }
    return true;
}

/**
 * Called when either the game is won or lost, renders an overlay on the board with game over message
 * @param  string result either "win" or "loss"
 * @return void
 */
function renderGameOver(result){
    // console.log("GAME OVER RENDER CALLED: RES="+result);

    // Render transparent grey cover over the board
    drawer.globalAlpha = 0.5;
    drawer.beginPath();
    drawer.rect(OFFSET, OFFSET, CELL_WIDTH*N, CELL_WIDTH*N);
    drawer.fillStyle="black";
    drawer.fill();

    // var text = "GAME OVER";
    var text = "YOU WIN!";
    var scoreText = "Final Score: " + score.toString();
    if(result === "loss"){
        text = "GAME OVER";
    }

    var midX = ((OFFSET*2) + (CELL_WIDTH*N))/2;
    var midY = midX - (CELL_WIDTH/2); //Want to have the game over text a little above mid

    drawer.globalAlpha = 0.65;
    drawer.font = "32pt" + CELL_FONT;
    drawer.fillStyle = "white";
    drawer.textBaseline = "middle";
    drawer.textAlign = "center";
    drawer.fillText(text, midX, midY);

    drawer.font = "18pt" + CELL_FONT;
    midY = midY + 3*(CELL_WIDTH/4);
    drawer.fillText(scoreText, midX, midY);
    drawer.globalAlpha = 1;
}

/*
    Called when user presses down arrow
 */
function moveDown () {
    // console.log("Moving Down");
    // console.log(board);
    var movePossible = false; //Assume no move possible at beginning
    for(var col=0; col < N; col++){
        // Go thrugh each row in col from bottom
        // And see if you can mvoe the square down
        for(var row=(N-1); row >= 0; row--){
            var curSquare = board[row][col];
            // console.log(curSquare);

            if(row == (N-1)){
                // console.log("Bottom square.");
                continue;
            }

            if(curSquare.val === -1){
                // console.log("Empty Square.");
                continue;
            }

            // console.log("Checking if can move down");
            var origX = curSquare.x;
            var origY = curSquare.y;
            var origVal = curSquare.val;
            var squareMoved = false;
            var candidateVal = -1;

            // Go through squares below this one
            for(var i=row+1; i < N; i++){
                var candidateSquare = board[i][col];
                if(candidateSquare.val !== -1){
                    // See if you can merge
                    if(candidateSquare.val === curSquare.val){
                        if(candidateSquare.merged){
                            // console.log("Square cannot be merged into as it has already merged this turn");
                            movePossible = true;
                            break;
                        }
                        // console.log("mergeing down");
                        // Gather anim info
                        if(candidateSquare.isMoving){
                            candidateVal = candidateSquare.replaceVal;
                        }else{
                            candidateVal = candidateSquare.val;
                        }
                        curSquare.setVal(curSquare.val + candidateSquare.val);
                        score = score + curSquare.val;
                        // Siwtch squares in board array
                        board[i][col] = curSquare;
                        board[i-1][col] = candidateSquare;
                        // Adjust square internal values
                        candidateSquare.setVal(-1);
                        curSquare.setGrid(i, col);
                        candidateSquare.setGrid(i-1,col);
                        // Swap coordinates
                        swapCoords(curSquare, candidateSquare);
                        curSquare.merged = true;
                        movePossible = true;
                        squareMoved = true;
                    }
                    break;
                }
                // console.log("Switching row to "+candidateSquare.row);
                board[i][col] = curSquare;
                board[i-1][col] = candidateSquare;
                // Adjust square internal values
                curSquare.setGrid(i, col);
                candidateSquare.setGrid(i-1,col);
                // Swap coordinates
                swapCoords(curSquare, candidateSquare);

                movePossible = true;
                squareMoved = true;
            }
            if(squareMoved){
                // console.log("curSquare");
                // console.log(curSquare);
                curSquare.startMove(candidateVal, origVal, origX, origY);
            }
            // console.log("--------");
        }
    }
    // console.log("Done moving down");
    return movePossible;
}

/*
    Called when user presses Up arrow
 */
function moveUp(){
    // console.log("Moving Up");
    // console.log(board);
    var movePossible = false; //Assume no move possible at beginning
    // Go column by column
    for(var col=0; col<N; col++){
        // Go through row by row starting from top
        for(row=0; row < N; row++){

            var curSquare = board[row][col];
            console.log(curSquare);

            if(row == 0){
                // console.log("Top square.");
                continue;
            }

            if(curSquare.val === -1){
                // console.log("Empty Square.");
                continue;
            }

            // console.log("Checking if can move up");
            var origX = curSquare.x;
            var origY = curSquare.y;
            var origVal = curSquare.val;
            var squareMoved = false;
            var candidateVal = -1;
            // Go through squares below this one
            for(var i=(row-1); i >= 0; i--){
                var candidateSquare = board[i][col];
                if(candidateSquare.val !== -1){
                    // See if you can merge
                    if(candidateSquare.val === curSquare.val){
                        if(candidateSquare.merged){
                            // console.log("Square cannot be merged into as it has already merged this turn");
                            movePossible = true;
                            break;
                        }
                        // console.log("mergeing up");
                        // Gather anim info
                        if(candidateSquare.isMoving){
                            candidateVal = candidateSquare.replaceVal;
                        }else{
                            candidateVal = candidateSquare.val;
                        }

                        curSquare.setVal(curSquare.val + candidateSquare.val);
                        score = score + curSquare.val;
                        // Siwtch squares in board array
                        board[i][col] = curSquare;
                        board[i+1][col] = candidateSquare;
                        // Adjust square internal values
                        candidateSquare.setVal(-1);
                        curSquare.setGrid(i, col);
                        candidateSquare.setGrid(i+1,col);
                        swapCoords(curSquare, candidateSquare);
                        curSquare.merged = true;
                        movePossible = true;
                        squareMoved = true;
                    }
                    break;
                }
                // console.log("Switching row to "+candidateSquare.row);
                board[i][col] = curSquare;
                board[i+1][col] = candidateSquare;
                // Adjust square internal values
                swapCoords(curSquare, candidateSquare);
                curSquare.setGrid(i, col);
                candidateSquare.setGrid(i+1,col);
                movePossible = true;
                squareMoved = true;
            }
            if(squareMoved){
                // console.log("curSquare moved");
                // console.log(curSquare);
                curSquare.startMove(candidateVal, origVal, origX, origY);
            }
            // console.log("--------");
        }
    }
    // console.log("Done moving up");
    return movePossible;
}

/*
    Called when user presses right key
 */
function moveRight(){
    // console.log("Moving right.");
    // console.log(board);
    var movePossible = false; //Assume no move possible at beginning
    // Go row by row
    for(var row=0; row<N;row++){
        // Go through each col starting from right side
        for(var col=(N-1); col>=0; col--){

            if(col === (N-1)){
                // console.log("Rightmost square");
                continue;
            }

            var curSquare = board[row][col];
            if(curSquare.val === -1){
                // console.log("Empty square");
                continue;
            }

            // console.log("Checking if can move right");
            var origX = curSquare.x;
            var origY = curSquare.y;
            var origVal = curSquare.val;
            var squareMoved = false;
            var candidateVal = -1;
            // Go through squares to the right of this one
            for(var i=(col+1); i < N; i++){
                var candidateSquare = board[row][i];
                if(candidateSquare.val !== -1){
                    // See if you can merge
                    if(candidateSquare.val === curSquare.val){
                        if(candidateSquare.merged){
                            // console.log("Square cannot be merged into as it has already merged this turn");
                            movePossible = true;
                            break;
                        }
                        // console.log("mergeing right");
                        // Gather anim info
                        // If the candidate square is itself moving then we want to take its old value to get correct anim
                        if(candidateSquare.isMoving){
                            candidateVal = candidateSquare.replaceVal;
                        }else{
                            candidateVal = candidateSquare.val;
                        }

                        curSquare.setVal(curSquare.val + candidateSquare.val);
                        score = score + curSquare.val;
                        // Siwtch squares in board array
                        board[row][i] = curSquare;
                        board[row][i-1] = candidateSquare;
                        // Adjust square internal values
                        candidateSquare.setVal(-1);
                        swapCoords(curSquare, candidateSquare);
                        curSquare.setGrid(row, i);
                        candidateSquare.setGrid(row,i-1);

                        curSquare.merged = true;
                        movePossible = true;
                        squareMoved = true;
                    }
                    break;
                }
                // If the square to the right is empty then we swap the squares
                // console.log("Switching col to "+candidateSquare.col);
                board[row][i] = curSquare;
                board[row][i-1] = candidateSquare;
                // Adjust square internal values
                curSquare.setGrid(row, i);
                candidateSquare.setGrid(row,i-1);

                swapCoords(curSquare, candidateSquare);
                movePossible = true;
                squareMoved = true;
            }
            // Start the animation
            if(squareMoved){
                // console.log("curSquare");
                // console.log(curSquare);
                curSquare.startMove(candidateVal, origVal, origX, origY);
            }
            // console.log("--------");
        }
    }
    // console.log("Move right done");
    return movePossible;
}

/*
    Called when left arrow pressed
 */
function moveLeft(){
    // console.log("Moving left.");
    // console.log(board);
    var movePossible = false; //Assume no move possible at beginning
    // Go row by row
    for(var row=0; row<N;row++){
        // Go through each col starting from left side
        for(var col=0; col<N; col++){

            if(col === 0){
                // console.log("Leftmost square");
                continue;
            }

            var curSquare = board[row][col];
            if(curSquare.val === -1){
                // console.log("Empty square");
                continue;
            }

            // console.log("Checking if can move left");
            var origX = curSquare.x;
            var origY = curSquare.y;
            var origVal = curSquare.val;
            var squareMoved = false;
            var candidateVal = -1;
            // Go through squares to the left of this one
            for(var i=(col-1); i >= 0; i--){
                var candidateSquare = board[row][i];
                if(candidateSquare.val !== -1){
                    // See if you can merge
                    if(candidateSquare.val === curSquare.val){
                        if(candidateSquare.merged){
                            // console.log("Square cannot be merged into as it has already merged this turn");
                            movePossible = true;
                            break;
                        }
                        // console.log("mergeing left");
                        // Gather anim info
                        if(candidateSquare.isMoving){
                            candidateVal = candidateSquare.replaceVal;
                        }else{
                            candidateVal = candidateSquare.val;
                        }
                        curSquare.setVal(curSquare.val + candidateSquare.val);
                        score = score + curSquare.val;
                        // Switch squares in board array
                        board[row][i] = curSquare;
                        board[row][i+1] = candidateSquare;
                        // Adjust square internal vals
                        candidateSquare.setVal(-1);
                        curSquare.setGrid(row, i);
                        candidateSquare.setGrid(row,i+1);
                        swapCoords(curSquare, candidateSquare);
                        curSquare.merged = true;
                        movePossible = true;
                        squareMoved = true;
                    }
                    break;
                }
                // console.log("Switching col to "+candidateSquare.col);
                board[row][i] = curSquare;
                board[row][i+1] = candidateSquare;
                // Adjust square internal values
                curSquare.setGrid(row, i);
                candidateSquare.setGrid(row,i+1);

                swapCoords(curSquare, candidateSquare);
                movePossible = true;
                squareMoved = true;
            }
            if(squareMoved){
                // console.log("curSquare");
                // console.log(curSquare);
                curSquare.startMove(candidateVal, origVal, origX, origY);
            }
            // console.log("--------");
        }
    }
    // console.log("Move left done.");
    return movePossible;
}

keypressDelayActive = false;
keypressDelay = 200; //in ms, ensure keypress delay is atleast as long as the animation duration
console.log("Keypress delay set to "+keypressDelay);

// Capture Arrow Keys
window.addEventListener("keydown", function(e) {
    // space and arrow keys
    if(e.keyCode === 40){
        e.preventDefault();
        // console.log("Down Key");
        if(keypressDelayActive === true){
            // console.log("Keypress delay active");
            return;
        }else if(gameWon || gameLost){
            console.log("Game is over");
            // Dont allow any more key presses
            keypressDelayActive = true;
        }else{
            if(!moveDown()){
                console.log("No move possible");
            }else{
                advanceTurn();
                renderBoard();
                keypressDelayActive = true;
                setTimeout(function(){keypressDelayActive = false;}, keypressDelay);
            }
        }
    }
    if(e.keyCode === 39){
        e.preventDefault();
        // console.log("Right Key");
        if(keypressDelayActive === true){
            // console.log("Keypress delay active");
            return;
        }else if(gameWon || gameLost){
            // console.log("Game is over");
            // Dont allow any more key presses
            keypressDelayActive = true;
        }else{
            if(!moveRight()){
                console.log("No move possible");
            }else{
                advanceTurn();
                renderBoard();
                keypressDelayActive = true;
                setTimeout(function(){keypressDelayActive = false;}, keypressDelay);
            }
        }
    }
    if(e.keyCode === 38){
        e.preventDefault();
        // console.log("Up Key");
        if(keypressDelayActive === true){
            // console.log("Keypress delay active");
            return;
        }else if(gameWon || gameLost){
            console.log("Game is over");
            // Dont allow any more key presses
            keypressDelayActive = true;
        }else{
            if(!moveUp()){
                console.log("No move possible");
            }else{
                advanceTurn();
                renderBoard();
                keypressDelayActive = true;
                setTimeout(function(){keypressDelayActive = false;}, keypressDelay);
            }
        }
    }
    if(e.keyCode === 37){
        e.preventDefault();
        // console.log("Left Key");
        if(keypressDelayActive === true){
            // console.log("Keypress delay active");
            return;
        }else if(gameWon || gameLost){
            console.log("Game is over");
            // Dont allow any more key presses
            keypressDelayActive = true;
        }else{
            if(!moveLeft()){
                console.log("No move possible");
            }else{
                advanceTurn();
                renderBoard();
                keypressDelayActive = true;
                setTimeout(function(){keypressDelayActive = false;}, keypressDelay);
            }
        }
    }
}, false);