// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const aboutSection = document.getElementById('about-section');
    const gamesListSection = document.getElementById('games-list-section');
    const gameDetailSection = document.getElementById('game-detail-section');
    const gameDetailContent = document.getElementById('game-detail-content');
    const gameListContainer = document.getElementById('game-list-container');
    const navAboutButton = document.getElementById('nav-about');
    const navGamesButton = document.getElementById('nav-games');
    const backToListButton = document.getElementById('back-to-list');
    const darkModeToggleButton = document.getElementById('dark-mode-toggle');
    const searchBar = document.getElementById('search-bar');
    const sortSelect = document.getElementById('sort-select');

    let allGamesData = [];
    // currentlyDisplayedGames is primarily for the list view, not needed for routing game details directly.

    // --- Helper Functions ---
    function slugify(text) {
        if (!text) return '';
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w-]+/g, '')       // Remove all non-word chars (alphanumeric, underscore, hyphen)
            .replace(/--+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    }

    // Set initial loading message for game list
    if (gameListContainer) {
        gameListContainer.innerHTML = '<p class="loading-message" style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">Loading games...</p>';
    }

    // Function to fetch and process game data
    async function loadGameData() {
        try {
            const response = await fetch('data/games.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            allGamesData = jsonData.map((game, index) => {
                // Create a deterministic ID
                let baseSlug = game.name ? slugify(game.name) : 'unnamed-game';
                // Ensure baseSlug is not empty after slugify (e.g. if name was only symbols)
                if (!baseSlug) {
                    baseSlug = 'unnamed-game';
                }
                // Append index to ensure global uniqueness and determinism
                const deterministicId = `${baseSlug}-${index}`;
                return {
                    ...game,
                    id: deterministicId
                };
            });
            // currentlyDisplayedGames will be repopulated by filterAndPopulateGameList if #games is shown
            handleRouteChange(); // Process initial URL hash now that data is loaded
        } catch (error) {
            console.error("Could not load game data:", error);
            if (gameListContainer) { // Error message for the list view
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">Could not load game data. Please try again later.</p>';
            }
            // If on a game detail page and data load fails, handleRouteChange will show an error there.
            allGamesData = []; // Ensure it's empty on error
            handleRouteChange(); // Still route, will handle error states appropriately
        }
    }

    // Dark Mode Functionality
    function updateDarkModeButtonText(isDark) {
        if (darkModeToggleButton) {
            darkModeToggleButton.innerHTML = isDark ? '☀️ <span class="button-text">Light Mode</span>' : '🌙 <span class="button-text">Dark Mode</span>';
        }
    }

    function setDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
        updateDarkModeButtonText(isDark);
    }

    const currentTheme = localStorage.getItem('theme');
    const initialIsDark = currentTheme === 'dark' || (!currentTheme && window.matchMedia && !window.matchMedia('(prefers-color-scheme: light)').matches);
    setDarkMode(initialIsDark);

    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', () => {
            setDarkMode(!document.body.classList.contains('dark-mode'));
        });
    }

    // --- Section Display (Visual only) ---
    function showSection(sectionToShow) {
        if (!aboutSection || !gamesListSection || !gameDetailSection) return;
        [aboutSection, gamesListSection, gameDetailSection].forEach(section => {
            if (section) section.classList.remove('active');
        });
        if (sectionToShow) sectionToShow.classList.add('active');
    }

    // --- Game Detail Display ---
    function getSteamAppId(steamLink) {
        if (!steamLink) return null;
        const match = steamLink.match(/\/app\/(\d+)\//);
        return match ? match[1] : null;
    }

    function displayGameDetails(game) {
        if (!game || !gameDetailContent) return;
        const appId = getSteamAppId(game.steamLink);
        const steamImageUrl = appId ? `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg` : '';
        const imageHtml = appId ? `<img src="${steamImageUrl}" alt="${game.name || 'Game'} Header Image" class="steam-header-image">` : '<p><em>(Header image not available)</em></p>';

        gameDetailContent.innerHTML = `
            <div class="game-card">
                ${imageHtml}
                <h3>${game.name || 'Untitled Game'}</h3>
                <p><a href="${game.steamLink || '#'}" target="_blank" class="game-link" rel="noopener noreferrer">View ${game.linkName || game.name || 'Game'} on Steam</a></p>
                <div class="description"><p>${game.description || 'No description available.'}</p></div>
                <p><a href="${game.reviewsLink || '#'}" target="_blank" class="reviews-link" rel="noopener noreferrer">Steam Reviews</a></p>
                <p class="price">MSRP: ${game.price || 'N/A'}</p>
                <div class="sales-info">${game.sales || 'N/A'}</div>
            </div>`;
        showSection(gameDetailSection);
        const headerOffset = document.querySelector('.header-bar')?.offsetHeight || 60;
        const elementPosition = gameDetailSection.getBoundingClientRect().top + window.pageYOffset;
        const offsetPosition = elementPosition - headerOffset - 20;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    // --- Game List Population, Filtering, and Sorting ---
    function filterAndPopulateGameList() {
        if (!searchBar || !gameListContainer || !sortSelect) return;
        const searchTerm = searchBar.value.toLowerCase();
        
        let filteredGames = allGamesData.filter(game => { // Use allGamesData as the source
            return game.name && game.name.toLowerCase().includes(searchTerm);
        });

        const sortBy = sortSelect.value;
        let sortedGames = [...filteredGames];

        const parsePrice = (priceStr) => {
            if (typeof priceStr !== 'string') return Infinity;
            if (priceStr.toLowerCase() === 'free') return 0;
            const num = parseFloat(priceStr.replace(/[^0-9$.]/g, '').replace('$', ''));
            return isNaN(num) ? Infinity : num;
        };

        switch (sortBy) {
            case 'price-asc':
                sortedGames.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
                break;
            case 'price-desc':
                sortedGames.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
                break;
            case 'alpha-asc':
                sortedGames.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
                break;
            case 'alpha-desc':
                sortedGames.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
                break;
            case 'original':
                // Default order is based on filteredGames which maintains relative order from allGamesData
                break;
        }
        
        // This variable isn't strictly needed if createGameListItem uses sortedGames directly.
        // let currentlyDisplayedGames = sortedGames; // Used for clarity if needed elsewhere.

        gameListContainer.innerHTML = ''; // Clear previous list (including "Loading..." or error messages from loadGameData)

        if (allGamesData.length === 0 && !gameListContainer.querySelector('p')) {
            // This case means loadGameData succeeded but games.json was an empty array.
            // If loadGameData failed, it would have already set an error message.
            gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games found in the data source.</p>';
            return;
        }


        if (sortedGames.length === 0) { // Check sortedGames for display
            if (searchTerm) { // Check if searchTerm was actually set
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games found matching your search.</p>';
            } else if (allGamesData.length > 0) { // Only show this if there *are* games but filter/sort yields none
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games to display with current sort options.</p>';
            }
            // If allGamesData.length is 0, the previous block or loadGameData's catch handles the message.
        } else {
            sortedGames.forEach(game => createGameListItem(game));
        }
    }

    function createGameListItem(game) {
        if (!gameListContainer || !game) return;
        const gameItem = document.createElement('div');
        gameItem.classList.add('game-list-item');
        gameItem.setAttribute('role', 'listitem');

        const gameNameSpan = document.createElement('span');
        gameNameSpan.classList.add('game-name');
        gameNameSpan.textContent = game.name || 'Unnamed Game';

        const gameMsrpSpan = document.createElement('span');
        gameMsrpSpan.classList.add('game-msrp');
        gameMsrpSpan.textContent = game.price || 'N/A';

        gameItem.appendChild(gameNameSpan);
        gameItem.appendChild(gameMsrpSpan);

        gameItem.addEventListener('click', () => {
            window.location.hash = `#game/${encodeURIComponent(game.id)}`;
        });
        gameListContainer.appendChild(gameItem);
    }

    // --- Routing ---
    function handleRouteChange() {
        const hash = window.location.hash;

        if (!aboutSection || !gamesListSection || !gameDetailSection || !navAboutButton || !navGamesButton) {
            console.warn("Routing: Essential DOM elements not found. Aborting route change.");
            return;
        }

        showSection(null); // Deactivate all sections visually

        [navAboutButton, navGamesButton].forEach(btn => {
            if (btn) {
                btn.classList.remove('active');
                btn.setAttribute('aria-pressed', 'false');
            }
        });

        if (hash.startsWith('#game/')) {
            const gameId = decodeURIComponent(hash.substring('#game/'.length));
            
            // Always activate navGamesButton for game detail or game list views
            if (navGamesButton) {
                navGamesButton.classList.add('active');
                navGamesButton.setAttribute('aria-pressed', 'true');
            }

            if (allGamesData.length === 0) {
                // This means loadGameData either failed or returned an empty list from JSON.
                console.warn(`Cannot display game "${gameId}". Game data is empty or failed to load.`);
                if (gameDetailContent) {
                     gameDetailContent.innerHTML = `<p style="text-align:center; padding:20px;">Could not load details for game "${gameId}". The game data might be unavailable. Please try returning to the <a href="#games">games list</a>.</p>`;
                }
                showSection(gameDetailSection); // Show the detail section with this error.
                return; // Do not attempt to find game or change hash
            }

            const game = allGamesData.find(g => g.id === gameId);
            if (game) {
                displayGameDetails(game); // This calls showSection(gameDetailSection)
            } else {
                // Game ID not found in the (populated) allGamesData.
                // This means the URL has an ID for a game that doesn't exist in the current data.
                console.warn(`Game with id "${gameId}" not found in the dataset. Redirecting to games list.`);
                // Show a message in game detail before redirecting
                if (gameDetailContent) {
                    gameDetailContent.innerHTML = `<p style="text-align:center; padding:20px;">The game you're looking for ("${gameId}") was not found. You will be redirected to the main games list.</p>`;
                }
                showSection(gameDetailSection); // Display the message
                
                // Redirect to games list after a short delay so user can see message
                // This is optional, can redirect immediately by removing setTimeout
                setTimeout(() => {
                    if (window.location.hash !== '#games') { // Avoid redundant hash change if already there
                         window.location.hash = '#games';
                    } else { // If hash is already #games, but we are in this error path, force a re-evaluation
                        handleRouteChange(); // Re-process #games route to show list
                    }
                }, 2000); // 2 second delay
            }
        } else if (hash === '#games') {
            showSection(gamesListSection);
            filterAndPopulateGameList(); // Ensure list is populated/updated
            if (navGamesButton) {
                navGamesButton.classList.add('active');
                navGamesButton.setAttribute('aria-pressed', 'true');
            }
        } else if (hash === '#about' || hash === '') {
            showSection(aboutSection);
            if (navAboutButton) {
                navAboutButton.classList.add('active');
                navAboutButton.setAttribute('aria-pressed', 'true');
            }
            if (hash === '') window.location.hash = '#about';
        } else {
            // Fallback for unknown hashes
            console.warn(`Unknown hash: ${hash}. Redirecting to about.`);
            showSection(aboutSection);
            if (navAboutButton) {
                navAboutButton.classList.add('active');
                navAboutButton.setAttribute('aria-pressed', 'true');
            }
            if (window.location.hash !== '#about') window.location.hash = '#about';
        }
    }

    // --- Event Listeners Setup ---
    if (navAboutButton) {
        navAboutButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#about';
        });
    }

    if (navGamesButton) {
        navGamesButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchBar) searchBar.value = '';
            if (sortSelect) sortSelect.value = 'original';
            window.location.hash = '#games';
        });
    }

    if (backToListButton) {
        backToListButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.hash = '#games';
        });
    }
    
    if (searchBar) {
        searchBar.addEventListener('input', filterAndPopulateGameList);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', filterAndPopulateGameList);
    }

    // --- Initial Setup ---
    loadGameData(); // Fetches data and then calls handleRouteChange
    window.addEventListener('hashchange', handleRouteChange);
});