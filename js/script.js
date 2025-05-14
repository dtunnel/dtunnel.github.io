// js/script.js

document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References (get them once DOM is ready)
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

    let gamesData = []; // Initialize as an empty array

    // Function to fetch and process game data
    async function loadGameData() {
        try {
            const response = await fetch('data/games.json'); // Path to your JSON file
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            gamesData = await response.json();
            console.log("Game data loaded:", gamesData); // For debugging
            filterAndPopulateGameList(); // Populate the list once data is loaded
        } catch (error) {
            console.error("Could not load game data:", error);
            if (gameListContainer) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--about-text-color);">Could not load game data. Please try again later.</p>';
            }
        }
    }

    // Dark Mode Functionality
    function setDarkMode(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            darkModeToggleButton.textContent = '☀️ Light Mode';
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            darkModeToggleButton.textContent = '🌙 Dark Mode';
            localStorage.setItem('theme', 'light');
        }
    }

    // Section Navigation
    function showSection(sectionToShow) {
        // Ensure all sections are defined before trying to hide/show
        if (!aboutSection || !gamesListSection || !gameDetailSection) {
            console.error("One or more sections are not found in the DOM.");
            return;
        }
        [aboutSection, gamesListSection, gameDetailSection].forEach(section => {
            if (section) section.classList.remove('active');
        });
        if (sectionToShow) sectionToShow.classList.add('active');

        // Update nav button active state
        if (!navAboutButton || !navGamesButton) {
             console.error("Nav buttons not found.");
             return;
        }
        [navAboutButton, navGamesButton].forEach(btn => {
            if(btn) btn.classList.remove('active')
        });

        if (sectionToShow === aboutSection && navAboutButton) navAboutButton.classList.add('active');
        if ((sectionToShow === gamesListSection || sectionToShow === gameDetailSection) && navGamesButton) navGamesButton.classList.add('active');
    }

    // Game Detail Display
    function getSteamAppId(steamLink) {
        if (!steamLink) return null;
        const match = steamLink.match(/\/app\/(\d+)\//);
        return match ? match[1] : null;
    }

    function displayGameDetails(game) {
        if (!game || !gameDetailContent) {
            console.error("Game data or detail content area is missing.");
            return;
        }
        const appId = getSteamAppId(game.steamLink);
        const steamImageUrl = appId ? `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg` : '';
        const imageHtml = appId ? `<img src="${steamImageUrl}" alt="${game.name || 'Game'} Header Image" class="steam-header-image">` : '<p><em>(Header image not available)</em></p>';
        
        gameDetailContent.innerHTML = `
            <div class="game-card">
                ${imageHtml}
                <h3>${game.name || 'Untitled Game'}</h3>
                <p><a href="${game.steamLink || '#'}" target="_blank" class="game-link">View ${game.linkName || game.name || 'Game'} on Steam</a></p>
                <div class="description"><p>${game.description || 'No description available.'}</p></div> 
                <p><a href="${game.reviewsLink || '#'}" target="_blank" class="reviews-link">Steam Reviews</a></p>
                <p class="price">MSRP: ${game.price || 'N/A'}</p>
                <div class="sales-info">${game.sales || 'N/A'}</div>
            </div>`;
        showSection(gameDetailSection);
        window.scrollTo({ top: gameDetailSection.offsetTop - 20, behavior: 'smooth' });
    }

    // Game List Population and Filtering
    function filterAndPopulateGameList() {
        if (!searchBar || !gameListContainer) {
            console.error("Search bar or game list container not found.");
            return;
        }
        const searchTerm = searchBar.value.toLowerCase();
        gameListContainer.innerHTML = ''; 
        
        const filteredGames = gamesData.filter(game => {
            return game.name && game.name.toLowerCase().startsWith(searchTerm);
        });

        if (filteredGames.length === 0) {
            if (searchTerm) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--about-text-color);">No games found matching your search.</p>';
            } else if (gamesData.length > 0) { // No search term, but data exists (show all)
                 gamesData.forEach(game => createGameListItem(game));
            } else { // No search term and no data (or data hasn't loaded yet)
                // Potentially show a loading message if gamesData is empty due to loading
                // For now, if gamesData is truly empty and not just loading, this is fine.
                 if(gamesData.length === 0 && !document.querySelector('.loading-message')) { // Avoid multiple loading messages
                    // gameListContainer.innerHTML = '<p class="loading-message" style="text-align:center; padding: 20px; color: var(--about-text-color);">Loading games...</p>';
                 }
            }
        } else {
             filteredGames.forEach(game => createGameListItem(game));
        }
    }

    function createGameListItem(game) {
        if (!gameListContainer) return;
        const gameItem = document.createElement('div');
        gameItem.classList.add('game-list-item');
        
        const gameNameSpan = document.createElement('span');
        gameNameSpan.classList.add('game-name');
        gameNameSpan.textContent = game.name || 'Unnamed Game';
        
        const gameMsrpSpan = document.createElement('span');
        gameMsrpSpan.classList.add('game-msrp');
        gameMsrpSpan.textContent = game.price || 'N/A';
        
        gameItem.appendChild(gameNameSpan);
        gameItem.appendChild(gameMsrpSpan);
        
        gameItem.addEventListener('click', () => displayGameDetails(game));
        gameListContainer.appendChild(gameItem);
    }

    // Event Listeners Setup
    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', () => {
            setDarkMode(!document.body.classList.contains('dark-mode'));
        });
    } else {
        console.error("Dark mode toggle button not found.");
    }

    if (navAboutButton) {
        navAboutButton.addEventListener('click', () => showSection(aboutSection));
    } else {
        console.error("About navigation button not found.");
    }

    if (navGamesButton) {
        navGamesButton.addEventListener('click', () => {
            if(searchBar) searchBar.value = ''; 
            filterAndPopulateGameList(); 
            showSection(gamesListSection);
        });
    } else {
        console.error("Games navigation button not found.");
    }

    if (backToListButton) {
        backToListButton.addEventListener('click', () => showSection(gamesListSection));
    } else {
        console.error("Back to list button not found.");
    }
    
    if (searchBar) {
        searchBar.addEventListener('input', filterAndPopulateGameList);
    } else {
        console.error("Search bar not found.");
    }

    // Initial Setup
    // Apply saved theme or system preference for dark mode
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        setDarkMode(currentTheme === 'dark');
    } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        setDarkMode(prefersDark);
    }

    showSection(aboutSection); // Show the "About" section by default
    loadGameData(); // Fetch game data and populate the list
});
