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
    let currentlyDisplayedGames = []; 

    // Function to fetch and process game data
    async function loadGameData() {
        try {
            const response = await fetch('data/games.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            allGamesData = jsonData.map(game => ({ ...game })); 
            currentlyDisplayedGames = [...allGamesData]; 
            filterAndPopulateGameList();
        } catch (error) {
            console.error("Could not load game data:", error);
            if (gameListContainer) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">Could not load game data. Please try again later.</p>';
            }
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
            document.body.classList.remove('light-mode'); // Explicitly remove light if adding dark
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode'); // Explicitly add light
            localStorage.setItem('theme', 'light');
        }
        updateDarkModeButtonText(isDark);
    }
    
    // Initialize Dark Mode Toggle Button Text and Body Class
    const currentTheme = localStorage.getItem('theme');
    // Default to dark for Steam feel if no theme saved
    const initialIsDark = currentTheme === 'dark' || (!currentTheme && window.matchMedia && !window.matchMedia('(prefers-color-scheme: light)').matches);
    setDarkMode(initialIsDark); // Apply and set initial button text

    if (darkModeToggleButton) {
        darkModeToggleButton.addEventListener('click', () => {
            setDarkMode(!document.body.classList.contains('dark-mode'));
        });
    }


    // Section Navigation
    function showSection(sectionToShow) {
        if (!aboutSection || !gamesListSection || !gameDetailSection) return;
        [aboutSection, gamesListSection, gameDetailSection].forEach(section => {
            if (section) section.classList.remove('active');
        });
        if (sectionToShow) sectionToShow.classList.add('active');

        if (!navAboutButton || !navGamesButton) return;
        [navAboutButton, navGamesButton].forEach(btn => {
            if(btn) btn.classList.remove('active');
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
        window.scrollTo({ top: gameDetailSection.offsetTop - 20, behavior: 'smooth' });
    }


    // Game List Population, Filtering, and Sorting
    function filterAndPopulateGameList() {
        if (!searchBar || !gameListContainer || !sortSelect) return;
        const searchTerm = searchBar.value.toLowerCase();
        
        let filteredGames = allGamesData.filter(game => {
            return game.name && game.name.toLowerCase().includes(searchTerm); // Changed to 'includes' for better search
        });

        const sortBy = sortSelect.value;
        let sortedGames = [...filteredGames]; 

        const parsePrice = (priceStr) => {
            if (typeof priceStr !== 'string') return Infinity; 
            if (priceStr.toLowerCase() === 'free') return 0;
            const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
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
                // For 'original', we need to ensure the order is based on allGamesData's current filter
                // If searchTerm is empty, sortedGames is already a copy of allGamesData (in original order)
                // If searchTerm is present, filteredGames already maintains relative original order.
                break; 
        }
        
        currentlyDisplayedGames = sortedGames; 

        gameListContainer.innerHTML = ''; 
        if (currentlyDisplayedGames.length === 0) {
            if (searchTerm) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games found matching your search.</p>';
            } else if (allGamesData.length > 0) { 
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games to display with current sort.</p>';
            } else {
                // This case means allGamesData is empty (still loading or failed)
                 if(allGamesData.length === 0 && !document.querySelector('.loading-message') && !gameListContainer.textContent.includes("Could not load")) { 
                    gameListContainer.innerHTML = '<p class="loading-message" style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">Loading games...</p>';
                 }
            }
        } else {
            currentlyDisplayedGames.forEach(game => createGameListItem(game));
        }
    }

    function createGameListItem(game) {
        if (!gameListContainer) return;
        const gameItem = document.createElement('div');
        gameItem.classList.add('game-list-item');
        gameItem.setAttribute('role', 'listitem'); // For accessibility
        
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
    if (navAboutButton) {
        navAboutButton.addEventListener('click', () => showSection(aboutSection));
    }

    if (navGamesButton) {
        navGamesButton.addEventListener('click', () => {
            if(searchBar) searchBar.value = ''; 
            if(sortSelect) sortSelect.value = 'original'; 
            filterAndPopulateGameList(); 
            showSection(gamesListSection);
        });
    }

    if (backToListButton) {
        backToListButton.addEventListener('click', () => showSection(gamesListSection));
    }
    
    if (searchBar) {
        searchBar.addEventListener('input', filterAndPopulateGameList);
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', filterAndPopulateGameList); 
    }

    // Initial Setup
    showSection(aboutSection);
    loadGameData(); 
});
