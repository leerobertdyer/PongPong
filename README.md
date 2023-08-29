# Progress!

**Updates**
I've managed to get all ball motion in the server side to update correctly
Had a bit of funky math in the ball direction changes that made it get stuck.

Also added a bit of code that makes it so if you hit the ball on the 
far left or far right it 'pushes' the ball one way or another.



## Game Start

> Still not getting multiple games running at once.
> Guessing it has to do with the disconnect event on both server and client side.

> We could still make a 'Waiting For Other Players' display._
> I have a timer div ready, once we iron things out a bit we can
> use the time to start the games in sync
> could use the same timer for a pause button...

> Still need these guys: 
> - p1 logs on and recieves 'waiting for second player' message
> - p2 logs on and sees a button to start game, p1 sees 'player 2 online'
> - p2 presses start button and both players see countdown
> - game starts at end of countdown

## Score Updates
> I think we need to update scores from server side. There are moments when 
> the scores don't line up, and I think part of it is the if statements we
> have in place to update.
> putting them on server side would keep the the same at least,
> but we will still need to fix the code sometimes one goal will equal 2 or more
> points...

## Other Functionality:

> **Single Player Mode!** 
> Will work on a single player option. Will involve
> updating the game start so that it doesn't assume two player and
> adding algorythms for the computer to "follow" the ball trajectory. 

> **Power Ups!**
> Little floating bubbles that 