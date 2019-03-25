def fruit_score(fruit):
    if fruit == "apple":
        return 10
    elif fruit == "orange":
        return 5
    
apple_score = fruit_score("apple")
orange_score = fruit_score("orange")

total = fruit_score("apple")+fruit_score("orange")
print(total)
