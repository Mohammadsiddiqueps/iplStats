let playersData = [];
let activePlayerCard = null;

async function fetchPlayers() {
  const response = await fetch("http://localhost:8000/players");
  playersData = await response.json();
  displayPlayers(playersData);
}

function displayPlayers(players) {
  const playerGrid = document.getElementById("playerGrid");
  playerGrid.innerHTML = "";

  players.forEach((player) => {
    const playerCard = document.createElement("div");
    playerCard.className = "player-card";
    playerCard.innerHTML = `<p>${player.player_name}</p>`;

    const playerInfo = document.createElement("div");
    playerInfo.className = "player-info";
    playerInfo.id = `info-${player.player_id}`;
    playerCard.appendChild(playerInfo);

    playerCard.onclick = () => togglePlayerInfo(player, playerInfo);
    playerGrid.appendChild(playerCard);
  });
}

function searchPlayer() {
  const query = document.getElementById("searchBox").value.toLowerCase();
  const filteredPlayers = playersData.filter((player) =>
    player.player_name.toLowerCase().includes(query)
  );
  displayPlayers(filteredPlayers);
}

async function fetchPlayerInfo(playerId) {
  const response = await fetch("http://localhost:8000/player-info", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ playerId }),
  });

  const playerData = await response.json();
  return playerData;
}

async function togglePlayerInfo(player, playerInfo) {
  if (activePlayerCard && activePlayerCard !== playerInfo) {
    activePlayerCard.style.display = "none";
  }

  if (playerInfo.style.display === "block") {
    playerInfo.style.display = "none";
    activePlayerCard = null;
  } else {
    const { totalruns, totalwickets } = await fetchPlayerInfo(player.player_id);

    playerInfo.innerHTML = `<p>Total Runs: ${totalruns}</p>
          <p>Total Wickets: ${totalwickets}</p>`;
    playerInfo.style.display = "block";

    activePlayerCard = playerInfo;
  }
}

fetchPlayers();
