from random import randint

pineapple = Actor("1")

def draw():
    screen.clear()
    pineapple.draw()

def place_pineapple():
    pineapple.x = randint(10,800)
    pineapple.y = randint(10,600)

def on_mouse_down(pos):
    if pineapple.collidepoint(pos):
       print("Good shot!")
       place_pineapple()
    else:
        print("You missed!")
        quit()      
        
place_pineapple()    
