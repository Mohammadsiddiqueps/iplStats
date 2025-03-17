// async function fetchTeamCups(teamId){
//   const response = await fetch
// }

async function fetchTeams() {
  const response = await fetch("http://localhost:8000/teams");
  const data = await response.json();

  const teamList = document.getElementById("teamList");
  teamList.innerHTML = "";
  data.forEach((team) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${team.team_name}</td><td>${team.team_abbr}</td><td>${team.team_id}</td>`;
    teamList.appendChild(row);
  });
}

fetchTeams();
