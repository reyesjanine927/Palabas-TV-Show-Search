/*
"Talk is cheap. Show me the code."
—Linus Torvalds
*/

// Palabas · WS1 TV Show Search code-along (TVmaze API, no key needed)
// Open DevTools (F12): keep the Console AND the Network tab open.
// Sample or live mode: see config.js.

// ---------- Given: page elements ----------
const form = document.getElementById("searchForm");
const input = document.getElementById("query");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const dialog = document.getElementById("details");
const detailsBody = document.getElementById("detailsBody");
const closeBtn = document.getElementById("closeDetails");
const modeBadge = document.getElementById("modeBadge");
let searchTimer = null; // This stores the wait timer if the user is typing.

// ---------- Given: the API's URLs ----------
const API = "https://api.tvmaze.com";

// Turns "Breaking Bad" into "breaking-bad" (used for the sample-data file names)
function slug(text) {
  return text.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// e.g. https://api.tvmaze.com/search/shows?q=breaking%20bad
function searchURL(query) {
  if (USE_SAMPLE_DATA) return `data/search/${slug(query)}.json`;
  return `${API}/search/shows?q=${encodeURIComponent(query)}`;
}

// e.g. https://api.tvmaze.com/shows/169
function showURL(id) {
  return USE_SAMPLE_DATA ? `data/shows/${id}.json` : `${API}/shows/${id}`;
}

// e.g. https://api.tvmaze.com/shows/169/cast
function castURL(id) {
  return USE_SAMPLE_DATA ? `data/cast/${id}.json` : `${API}/shows/${id}/cast`;
}

// e.g. https://api.tvmaze.com/shows/169/seasons
function seasonsURL(id) {
  return USE_SAMPLE_DATA ? `data/seasons/${id}.json` : `${API}/shows/${id}/seasons`;
}

// ---------- Given: helpers (no need to change) ----------

// Shows a message under the search box. type: "info", "loading" or "error"
function setStatus(message, type = "info") {
  statusText.textContent = message;
  statusText.className = "status " + type;
}

// Makes an element with an optional class and text: el("span", "year", "2008")
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// A poster <img>, or a placeholder when the show has no image (image is null)
function createPoster(show, size = "medium") {
  if (!show.image) {
    return el("span", "poster none", "No poster");
  }
  const img = el("img", "poster");
  img.src = show.image[size] || show.image.medium;
  img.alt = `Poster: ${show.name}`;
  img.loading = "lazy";
  img.addEventListener("error", () => img.replaceWith(el("span", "poster none", "No poster")));
  return img;
}

// "2008–2013", or "2016–" for a show that is still running
function yearRange(show) {
  const start = show.premiered ? show.premiered.slice(0, 4) : "?";
  const end = show.ended ? show.ended.slice(0, 4) : "";
  return `${start}–${end}`;
}

// TVmaze summaries contain HTML like "<p><b>Friends</b> follows…</p>".
// This keeps only the text. (Never put text from an API into innerHTML:
// if it contained a <script> or an onerror, it could run on your page.)
function stripTags(html) {
  if (!html) return "No summary yet.";
  return new DOMParser().parseFromString(html, "text/html").body.textContent;
}

// Close the details pop-up (Step 4) with the × button or by clicking outside it
closeBtn.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});


// Show which mode we're in
modeBadge.textContent = USE_SAMPLE_DATA ? "Sample data" : "Live · TVmaze";
modeBadge.classList.toggle("live", !USE_SAMPLE_DATA);

// STEP 1 — Your first API request
// TODO: async function testRequest(): fetch searchURL("friends"), log the status and the JSON array

//it send test requests Friends show data and displays the response details in the console to chect it if the API is woring.
/*async function testRequest() 
{
  const url = searchURL("friends");
  console.log("Request:", url);

  const response = await fetch(url);
  console.log("Status:", response.status, "ok?", response.ok);

  const data = await response.json();

  console.log(data);
  console.log("How many:", data.length);
  console.log("First show:", data[0].show.name, data[0].show.premiered);
}
testRequest();*/


// STEP 2 — Search and show the results
// TODO: renderResults(items), searchShows(query), and a submit listener on the form

// This clears the old results and displays each show as a card the have its information.
function renderResults(items) 
{
  results.innerHTML = "";

  items.forEach((item) => 
    { //loops every  search result
    const show = item.show;
    const card = el("button", "card");
    card.type = "button";
    card.dataset.id = show.id;
    const rating = show.rating.average;

    card.append(
      createPoster(show),
      el("span", "title", show.name),
      el("span", "year", yearRange(show)),
      el("span", "genres", show.genres.join(", ")),
      el("span", "rating", rating ? `★ ${rating}` : "Not rated yet")
    );

    results.appendChild(card);
  });
}

// This gets matching shows and displays them as cards.
/* async function searchShows(query) 
{
  const response = await fetch(searchURL(query));
  const items = await response.json();
  renderResults(items);
}*/

// this handles the search from when the user submits a show name.
form.addEventListener("submit", (event) => 
  {
    event.preventDefault();  
    clearTimeout(searchTimer); //This prevents the pending automatic search from running again when user click Search or press Enter.

     const query = input.value.trim();
     if (query === "") return;
     
     searchShows(query);
    });


// STEP 3 — getJSON(): one careful helper for every request
// TODO: catch network errors, check 429 and response.ok; rewrite searchShows with try / catch and an empty-array check

// This sends a request to gets data and reports a clear message if the request fails from the HTTP errors and return json data.
async function getJSON(url) 
{
  let response;

  try 
  {
    response = await fetch(url); // This send request
  } 
  catch (error) 
  {
    throw new Error("Can't reach TVmaze. Check your internet, or use sample mode.");
  }

  if (response.status === 429) 
  {
    throw new Error("Too many requests. Wait 10 seconds and try again.");
  }

  if (!response.ok) 
  {
    if (USE_SAMPLE_DATA) 
    {
      throw new Error(
        "That show is not in the sample data. Try friends, office, breaking bad, stranger things, sherlock, thrones, or sample."
      );
    }

    throw new Error(`Request failed. Error number: ${response.status}`);
  }

  return response.json();
}

// This searches for shows and displays the results and handles the error message if the request fails.
async function searchShows(query) 
{
  setStatus(`Searching for "${query}"…`, "loading");
  results.innerHTML = "";

  try 
  {
    const shows = await getJSON(searchURL(query));

    if (shows.length === 0) 
    { //this checks if the API returned an epty list
      setStatus(`No shows found for "${query}".`, "error");
      return;
    }

    renderResults(shows);

    const count = shows.length;
    const showWord = count === 1 ? "show" : "shows";
    setStatus(`${count} ${showWord} found for "${query}".`, "info");
  } 

  catch (error) 
  {
    setStatus(error.message, "error");
  }
}

// This waits until the user stop typing before searching.
input.addEventListener("input", () => {
  clearTimeout(searchTimer);

  const query = input.value.trim();
  if (query === "") return;

  searchTimer = setTimeout(() => {
    searchShows(query);
  }, 500);
});


// STEP 4 — Click a show to see its details
// TODO: one click listener on #results, showDetails(id), renderDetails(show)

// This finds the clicked show card and opens the details.
results.addEventListener("click", (event) => 
{
  const card = event.target.closest(".card");

  if (card) 
  {
    showDetails(card.dataset.id);
  }
});

// This will loads one shows details and shows any error in the pop-up.
/*async function showDetails(id) 
{
  detailsBody.replaceChildren(
    el("p", "status loading", "Loading details…")
  );
  dialog.showModal();

  try 
  {
    const show = await getJSON(showURL(id));
    renderDetails(show);
  } 

  catch (error) 
  {
    detailsBody.replaceChildren(
      el("p", "status error", error.message)
    );
  }
}*/

// This builds the show information inside the pop-up.
/*function renderDetails(show) 
{
  const network = show.network
    ? show.network.name
    : show.webChannel
      ? show.webChannel.name
      : "Unknown network";

  const runtime = show.runtime ?? show.averageRuntime;
  const runtimeText = runtime != null ? `${runtime} min` : "Unknown runtime";

  const rating = show.rating.average;
  const ratingText = rating != null ? `★ ${rating} / 10` : "Not rated yet";

  const info = el("div", "info");

  info.append(
    el("h2", "", show.name),
    el("p", "meta", `${yearRange(show)} · ${network} · ${show.genres.join(", ")} · ${runtimeText}`),
    el("p", "score", ratingText),
    el("p", "plot", stripTags(show.summary))
  );

  const link = el("a", "", "View on TVmaze ↗");
  link.href = show.url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";

  const links = el("p", "links");
  links.append(link);
  info.append(links);

  detailsBody.replaceChildren(createPoster(show, "original"), info);
}*/

// STEP 5 — Promise.all: show + cast + seasons at the same time
// TODO: rewrite showDetails with Promise.all, and renderDetails(show, cast, seasons)

// This will requests the show, cast, and season data at the same time.
async function showDetails(id) 
{
  detailsBody.replaceChildren(
    el("p", "status loading", "Loading details…"));
  dialog.showModal();

  try 
  {
    const start = performance.now();

    const [show, cast, seasons] = await Promise.all
    ([
      getJSON(showURL(id)),
      getJSON(castURL(id)),
      getJSON(seasonsURL(id))
    ]);

    const elapsed = Math.round(performance.now() - start);
    console.log(`3 requests in ${elapsed} ms`);

    renderDetails(show, cast, seasons);
  }
   catch (error) 
  {
    detailsBody.replaceChildren(
      el("p", "status error", error.message)
    );
  }
}

// This displays the show details, seasons, and cast in the pop-up.
function renderDetails(show, cast, seasons) 
{
  const network = show.network
    ? show.network.name
    : show.webChannel
      ? show.webChannel.name
      : "Network not listed";

  const runtime = show.runtime ?? show.averageRuntime;
  const runtimeText = runtime != null
    ? `${runtime} min`
    : "Runtime not listed";

  const seasonText = seasons.length === 1
    ? "1 season"
    : `${seasons.length} seasons`;

  const rating = show.rating?.average;
  const ratingText = rating != null
    ? `★ ${rating} / 10`
    : "Not rated yet";

  const info = el("div", "info");

  info.append(
    el("h2", "", show.name),
    el("p", "meta", `${yearRange(show)} · ${network} · ${show.genres.join(", ")} · ${runtimeText} · ${seasonText}`),
    el("p", "score", ratingText),
    el("h3", "", "Summary"),
    el("p", "plot", stripTags(show.summary))
  );

  if (cast.length > 0) 
    {
      const castList = el("ul", "cast");

    cast.slice(0, 6).forEach((member) => 
    {
      const personName = member.person?.name || "Unknown person";
      const characterName = member.character?.name || "Unknown character";
      const castItem = el("li", "", `${personName} `);

      castItem.append(el("span", "", `as ${characterName}`));
      castList.append(castItem);
    });

    info.append(el("h3", "", "Cast"), castList);
  }

  const tvmazeLink = el("a", "", "View on TVmaze ↗");
  tvmazeLink.href = show.url;
  tvmazeLink.target = "_blank";
  tvmazeLink.rel = "noopener noreferrer";

  const links = el("p", "links");
  links.append(tvmazeLink);
  info.append(links);

  detailsBody.replaceChildren(
    createPoster(show, "original"),
    info
  );
}
