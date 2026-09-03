import json
import random

levels = []

for x in range(200):
    # interpolate dimensions from 8x8 to 15x15
    frac = x / 199.0
    r = int(8 + 7 * frac)
    c = int(8 + 7 * frac)
    
    # interpolate checkpoints from 8 to 12
    num_q = int(8 + 4 * frac)
    
    # generate a path
    is_horiz = random.choice([True, False])
    path_chars = ""
    
    if is_horiz:
        for row in range(r):
            if row % 2 == 0:
                path_chars += "R" * (c - 1)
            else:
                path_chars += "L" * (c - 1)
            
            if row < r - 1:
                path_chars += "D"
    else:
        for col in range(c):
            if col % 2 == 0:
                path_chars += "D" * (r - 1)
            else:
                path_chars += "U" * (r - 1)
            
            if col < c - 1:
                path_chars += "R"
                
    # Pick checkpoints. The first cell and last cell are usually checkpoints.
    path_len = len(path_chars) + 1
    middle_indices = list(range(1, path_len - 1))
    sampled_indices = sorted(random.sample(middle_indices, num_q - 2))
    
    q_seq = [0] + sampled_indices + [path_len - 1]
    
    # Append to levels array
    levels.append({
        "r": r,
        "c": c,
        "k": 0,
        "s": 0,
        "d": path_chars,
        "q": q_seq,
        "w": [],
        "x": x
    })

# Output as JS
out = "window.THREAD_BOARDS.pro = " + json.dumps(levels, separators=(',', ':')) + ";"
with open("pro_boards.js", "w") as f:
    f.write(out)
print("Generated pro_boards.js")
