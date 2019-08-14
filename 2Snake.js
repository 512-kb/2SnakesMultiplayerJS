const socket = io()
var activeRegion = new ZingTouch.Region(document.body);
var canvas = document.getElementById('game'); 
var context = canvas.getContext('2d');
var p1Score = document.getElementById("p1Score");
var p2Score = document.getElementById("p2Score");
var index = -1;
var gameOver=true; 
var grid = 25;
var speed = 200; 
var snakes = [] , food = new Object();


socket.on('playerConnect',(ServerData) => {
  index = ServerData.index
  snakes = ServerData.snakeArray
  food = ServerData.food
})

context.fillStyle = "#23ebc3"; context.textAlign = "center"; context.font = "30px Trebuchet MS";
context.fillText("Press Enter to start", canvas.width/2, canvas.height/2); 


p1Score.innerHTML = "1st Player : 0";
p2Score.innerHTML = "2nd Player : 0";

function drawfood()
{
  context.fillStyle = food.color;
  context.fillRect( food.x , food.y , grid-1 , grid-1); 
}

function drawSnake(index)
{
  context.fillStyle = snakes[index].headColor;
  for(let i=0 ; i<snakes[index].cells.length ; i++)
  {
    if(i>0) context.fillStyle = snakes[index].bodyColor;
    if(i>3&&snakes[index].cells[i].x==snakes[index].cells[0].x&&snakes[index].cells[i].y==snakes[index].cells[0].y)
    {
      context.clearRect(0, 0, canvas.width,canvas.height); socket.emit('gameOver');  gameOver=true;      
      context.fillStyle = "#23ebc3";   context.textAlign = "center"; context.font = "155% Trebuchet MS";
      context.fillText("Game Over! Player " + ( getPlayerScore(1)>getPlayerScore(2) ? "1" : "2") + " Won", canvas.width/2, canvas.height/2); 
      context.fillText("Hit ENTER or TAP to Restart", canvas.width/2, canvas.height/2+(3*grid)); 
    
    if(snake[index].cells[i].x<0) snake[index].cells[i].x = canvas.width-grid;
    if(snake[index].cells[i].x>canvas.width-grid) snake[index].cells[i].x = 0;
    if(snake[index].cells[i].y<0) snake[index].cells[i].y = canvas.height-grid;
    if(snake[index].cells[i].y>canvas.height-grid) snake[index].cells[i].y = 0;
      
    activeRegion.bind(canvas, 'tap', function(e)
      {
        if(e)  window.location.href="snake.html";
      });
      return;
    }

    if(i==0) { snakes[index].x=snakes[index].cells[0].x; snakes[index].y=snakes[index].cells[0].y; }

    context.fillRect(snakes[index].cells[i].x, snakes[index].cells[i].y, grid-1, grid-1);
  }
  if(snakes[index].x==food.x&&snakes[index].y==food.y) 
  {    
    socket.emit('foodChanged');
  }
  p1Score.innerHTML = "1st Player : "+getPlayerScore(1); 
  p2Score.innerHTML = "2nd Player : "+getPlayerScore(2);
}

function getPlayerScore(playerNo)
{
    return snakes[playerNo-1].cells.length - 2 ;
}

function render()
{
  context.clearRect(0, 0, canvas.width,canvas.height);  
  drawfood();  
  for(let i=0;i<snakes.length;i++)
  {     
    drawSnake(i);
  }  
  console.log("RENDERED");
  setTimeout(render,200);
}

activeRegion.bind(canvas, 'tap', function(e)
{
  if(e && gameOver)  { socket.emit('gameStart'); render(); gameOver=false; }
});

activeRegion.bind(canvas, 'swipe', function(e)
{
  if(e.detail.data[0].currentDirection>135&&e.detail.data[0].currentDirection<225) 
    if( snakes[index].prevDirection!="right" &&  snakes[index].prevDirection!="left"  )  
      socket.emit('directionChange',"left",index);    
  if(e.detail.data[0].currentDirection>45&&e.detail.data[0].currentDirection<135)  
    if( snakes[index].prevDirection!="down"  &&  snakes[index].prevDirection!="up"    )  
      socket.emit('directionChange',"up",index);  
  if(e.detail.data[0].currentDirection>315&&e.detail.data[0].currentDirection<=360 || e.detail.data[0].currentDirection>45&&e.detail.data[0].currentDirection<=0)  
    if( snakes[index].prevDirection!="left"  &&  snakes[index].prevDirection!="right" )  
      socket.emit('directionChange',"right",index);                                                                  
  if(e.detail.data[0].currentDirection>225&&e.detail.data[0].currentDirection<315) 
  if( snakes[index].prevDirection!="up"    &&  snakes[index].prevDirection!="down"  )  
    socket.emit('directionChange',"down",index);  
});

document.addEventListener('keydown', function(e) 
{
  switch(e.keyCode)
  {
    case 13 : if(gameOver) { socket.emit('gameStart'); render(); gameOver=false; } break;
    case 100: if( snakes[index].prevDirection!="right" &&  snakes[index].prevDirection!="left"  )  socket.emit('directionChange',"left",index);    break;
    case 104: if( snakes[index].prevDirection!="down"  &&  snakes[index].prevDirection!="up"    )  socket.emit('directionChange',"up",index);      break;
    case 102: if( snakes[index].prevDirection!="left"  &&  snakes[index].prevDirection!="right" )  socket.emit('directionChange',"right",index);   break;
    case 101: if( snakes[index].prevDirection!="up"    &&  snakes[index].prevDirection!="down"  )  socket.emit('directionChange',"down",index);    break;
  }  

});

socket.on('updatedFood',(newFood) => {
  food = newFood;
});

socket.on('updatedDirection',(direction,indx) => {
  snakes[indx].direction = direction;   
  snakes[indx].prevDirection = direction;  
});

socket.on('snakes',(serverSnakes) => {
  snakes = serverSnakes
  console.log("UPDATED");
});

socket.on('gameIsOver',() => {

  gameOver = true;
  context.clearRect(0, 0, canvas.width,canvas.height);
  context.fillStyle = "#23ebc3";   context.textAlign = "center"; context.font = "155% Trebuchet MS";
  context.fillText("Game Over! Player " + ( getPlayerScore(1)>getPlayerScore(2) ? "1" : "2") + " Won", canvas.width/2, canvas.height/2); 
  context.fillText("Hit ENTER or TAP to Restart", canvas.width/2, canvas.height/2+(3*grid)); 
        
})
