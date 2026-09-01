function findPath(R, C) {
  const N = R * C;
  const adj = Array.from({length: N}, () => []);
  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      let u = r * C + c;
      if (r < R - 1) adj[u].push((r + 1) * C + c);
      if (c < C - 1) adj[u].push(r * C + (c + 1));
      if (r > 0) adj[u].push((r - 1) * C + c);
      if (c > 0) adj[u].push(r * C + (c - 1));
    }
  }

  // Warnsdorff's heuristic
  for (let i = 0; i < N; i++) adj[i].sort((a, b) => adj[a].length - adj[b].length);

  let path = [];
  let vis = new Array(N).fill(false);
  let steps = 0;

  function dfs(u) {
    steps++;
    if (steps > 10000) return false; // fail fast
    path.push(u);
    vis[u] = true;
    if (path.length === N) return true;

    // To add randomness, slightly shuffle neighbors of same degree
    let neighbors = [...adj[u]];
    neighbors.sort((a,b) => (adj[a].length + Math.random()*0.1) - (adj[b].length + Math.random()*0.1));

    for (let v of neighbors) {
      if (!vis[v]) {
        if (dfs(v)) return true;
      }
    }

    vis[u] = false;
    path.pop();
    return false;
  }

  let start = Math.floor(Math.random() * N);
  if (dfs(start)) return path;
  return null;
}

console.log("Testing 10x10...");
let p = findPath(10, 10);
console.log(p ? "Success: " + p.length : "Failed");
