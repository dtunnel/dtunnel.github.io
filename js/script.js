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
    const gameListStats = document.getElementById('game-list-stats');
    const paginationControlsContainer = document.getElementById('pagination-controls');
    const itemsPerPageSelect = document.getElementById('items-per-page-select');

    let allGamesData = [];
    let currentPage = 1; // Will be updated by hash or defaults to 1
    
    const ITEMS_PER_PAGE_STORAGE_KEY = 'userItemsPerPage';
    const DEFAULT_ITEMS_PER_PAGE = 10;
    let gamesPerPage = DEFAULT_ITEMS_PER_PAGE;

    const storedItemsPerPage = localStorage.getItem(ITEMS_PER_PAGE_STORAGE_KEY);
    if (storedItemsPerPage && itemsPerPageSelect) { // Check if itemsPerPageSelect exists
        const parsedValue = parseInt(storedItemsPerPage, 10);
        const allowedValues = Array.from(itemsPerPageSelect.options).map(opt => parseInt(opt.value, 10));
        if (allowedValues.includes(parsedValue)) {
            gamesPerPage = parsedValue;
        }
    }
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = gamesPerPage.toString();
    }

    function slugify(text) { /* ... (slugify function remains the same) ... */
        if (!text) return '';
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }

    if (gameListContainer) { /* ... (initial messages remain same) ... */
        gameListContainer.innerHTML = '<p class="loading-message" style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">Loading games...</p>';
    }
    if (gameListStats) {
        gameListStats.innerHTML = 'Loading game statistics...';
    }
    if (paginationControlsContainer) {
        paginationControlsContainer.innerHTML = '';
    }


    async function loadGameData() { /* ... (loadGameData remains same) ... */
        try {
            const response = await fetch('data/games.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const jsonData = await response.json();
            allGamesData = jsonData.map((game, index) => {
                let baseSlug = game.name ? slugify(game.name) : 'unnamed-game';
                if (!baseSlug) { baseSlug = 'unnamed-game'; }
                const deterministicId = `${baseSlug}-${index}`;
                return { ...game, id: deterministicId };
            });
            handleRouteChange();
        } catch (error) {
            console.error("Could not load game data:", error);
            if (gameListContainer) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">Could not load game data. Please try again later.</p>';
            }
            if (gameListStats) { gameListStats.innerHTML = 'Game statistics unavailable.'; }
            if (paginationControlsContainer) paginationControlsContainer.innerHTML = '';
            allGamesData = [];
            handleRouteChange();
        }
    }

    // ... (Dark mode functions, showSection, getSteamAppId, displayGameDetails, updateGameListStatistics remain the same) ...
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

    function showSection(sectionToShow) {
        if (!aboutSection || !gamesListSection || !gameDetailSection) return;
        [aboutSection, gamesListSection, gameDetailSection].forEach(section => {
            if (section) section.classList.remove('active');
        });
        if (sectionToShow) sectionToShow.classList.add('active');
    }

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


    function updateGameListStatistics(filteredCount, totalLibraryCount) {
        if (!gameListStats) return;

        if (totalLibraryCount === 0) {
            gameListStats.innerHTML = `Total games in library: 0`;
            return;
        }
        
        let statsText = `Showing ${filteredCount} of ${totalLibraryCount} games.`;
        if (filteredCount < totalLibraryCount && searchBar && searchBar.value && filteredCount !== allGamesData.length) {
            statsText += ` (Filtered)`;
        }
        gameListStats.innerHTML = statsText;
    }

    function renderPaginationControls(totalFilteredGames) {
        if (!paginationControlsContainer) return;
        paginationControlsContainer.innerHTML = '';

        const totalPages = Math.ceil(totalFilteredGames / gamesPerPage);

        if (totalPages <= 1) {
            return;
        }

        const prevButton = document.createElement('button');
        prevButton.classList.add('pagination-button');
        prevButton.textContent = '« Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                const newPage = currentPage - 1;
                window.location.hash = `#games/page/${newPage}`; // Update hash
                // handleRouteChange will then update currentPage and re-render
            }
        });
        paginationControlsContainer.appendChild(prevButton);

        const pageInfo = document.createElement('span');
        pageInfo.classList.add('pagination-info');
        const firstItem = Math.min((currentPage - 1) * gamesPerPage + 1, totalFilteredGames);
        const lastItem = Math.min(currentPage * gamesPerPage, totalFilteredGames);
        
        if (totalFilteredGames > 0) {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages} (Items ${firstItem}-${lastItem})`;
        } else {
            pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
        }
        paginationControlsContainer.appendChild(pageInfo);

        const nextButton = document.createElement('button');
        nextButton.classList.add('pagination-button');
        nextButton.textContent = 'Next »';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                const newPage = currentPage + 1;
                window.location.hash = `#games/page/${newPage}`; // Update hash
            }
        });
        paginationControlsContainer.appendChild(nextButton);
    }


    function filterAndPopulateGameList() {
        if (!searchBar || !gameListContainer || !sortSelect || !gameListStats || !paginationControlsContainer || !itemsPerPageSelect) return;
        
        const searchTerm = searchBar.value.toLowerCase();
        let filteredGames = allGamesData.filter(game => game.name && game.name.toLowerCase().includes(searchTerm));
        const sortBy = sortSelect.value;
        let sortedGames = [...filteredGames];

        const parsePrice = (priceStr) => { /* ... */ 
            if (typeof priceStr !== 'string') return Infinity;
            if (priceStr.toLowerCase() === 'free') return 0;
            const num = parseFloat(priceStr.replace(/[^0-9$.]/g, '').replace('$', ''));
            return isNaN(num) ? Infinity : num;
        };

        switch (sortBy) { /* ... */ 
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
                break;
        }
        
        updateGameListStatistics(sortedGames.length, allGamesData.length);

        const totalFilteredGames = sortedGames.length;
        // `currentPage` is now primarily set by `handleRouteChange` from the hash
        const totalPages = Math.ceil(totalFilteredGames / gamesPerPage);

        // Validate currentPage against totalPages (e.g. if filters reduce page count)
        // This check is important if currentPage was set from hash before filters were applied
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
            // If current page became invalid, reflect this in URL if user isn't already on page 1
            if (totalPages > 1) window.location.hash = `#games/page/${currentPage}`;
            else window.location.hash = `#games`;
            // Return or re-call might be needed if hash change triggers another route event immediately
            // For simplicity, we'll let the current render proceed with the corrected currentPage.
        } else if (totalPages === 0 && currentPage !== 1) {
            currentPage = 1; // Reset if no results
            // No need to change hash here as #games will be default
        }


        const startIndex = (currentPage - 1) * gamesPerPage;
        const endIndex = startIndex + gamesPerPage;
        const gamesToDisplayThisPage = sortedGames.slice(startIndex, endIndex);

        gameListContainer.innerHTML = '';

        if (allGamesData.length === 0 && !gameListContainer.querySelector('p')) {
            if (!gameListContainer.textContent.includes("Could not load game data")) {
                 gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games found in the data source.</p>';
            }
             renderPaginationControls(0);
            return;
        }

        if (totalFilteredGames === 0) {
            if (searchTerm) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games found matching your search.</p>';
            } else if (allGamesData.length > 0) {
                gameListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color: var(--text-secondary-dark);">No games to display.</p>';
            }
        } else {
            gamesToDisplayThisPage.forEach(game => createGameListItem(game));
        }
        
        renderPaginationControls(totalFilteredGames);
        // Scroll to top of game list when page changes, if not already there by pagination click.
        // This is more for when filters change the page content.
        if (gamesListSection.classList.contains('active')) {
            // Check if the top of the games list section is out of view
            const rect = gamesListSection.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                 // gamesListSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                 // Smoother scroll considering header:
                 const headerOffset = document.querySelector('.header-bar')?.offsetHeight || 60;
                 const elementPosition = gamesListSection.getBoundingClientRect().top + window.pageYOffset;
                 const offsetPosition = elementPosition - headerOffset - 20; 
                 window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        }
    }

    function createGameListItem(game) { /* ... (createGameListItem remains same) ... */
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

    function handleRouteChange() {
        const hash = window.location.hash;

        if (!aboutSection || !gamesListSection || !gameDetailSection || !navAboutButton || !navGamesButton || !gameListStats || !paginationControlsContainer || !itemsPerPageSelect) return;

        showSection(null);
        [navAboutButton, navGamesButton].forEach(btn => {
            if (btn) { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); }
        });
        
        gameListStats.style.display = 'none';
        paginationControlsContainer.style.display = 'none';

        if (hash.startsWith('#game/')) {
            // ... (game detail routing, unchanged)
            const gameId = decodeURIComponent(hash.substring('#game/'.length));
            if (navGamesButton) {
                navGamesButton.classList.add('active');
                navGamesButton.setAttribute('aria-pressed', 'true');
            }

            if (allGamesData.length === 0) {
                console.warn(`Cannot display game "${gameId}". Game data is empty or failed to load.`);
                if (gameDetailContent) {
                     gameDetailContent.innerHTML = `<p style="text-align:center; padding:20px;">Could not load details for game "${gameId}". The game data might be unavailable. Please try returning to the <a href="#games">games list</a>.</p>`;
                }
                showSection(gameDetailSection);
                return;
            }

            const game = allGamesData.find(g => g.id === gameId);
            if (game) {
                displayGameDetails(game);
            } else {
                console.warn(`Game with id "${gameId}" not found in the dataset. Redirecting to games list.`);
                if (gameDetailContent) {
                    gameDetailContent.innerHTML = `<p style="text-align:center; padding:20px;">The game you're looking for ("${gameId}") was not found. You will be redirected to the main games list.</p>`;
                }
                showSection(gameDetailSection);
                setTimeout(() => {
                    // Go to base #games (page 1) if game not found.
                    // Browser back will still work to previous paged URL if that's how user got here.
                    if (window.location.hash !== '#games') {
                         window.location.hash = '#games';
                    } else { // If hash somehow already #games, re-evaluate
                        handleRouteChange();
                    }
                }, 2000);
            }
        } else if (hash.startsWith('#games')) { // Matches #games and #games/page/N
            let pageFromHash = 1;
            const pageMatch = hash.match(/\/page\/(\d+)/);
            if (pageMatch && pageMatch[1]) {
                pageFromHash = parseInt(pageMatch[1], 10);
                if (isNaN(pageFromHash) || pageFromHash < 1) {
                    pageFromHash = 1; // Default to 1 if invalid page number
                    // Correct the hash if it was invalid like #games/page/foo
                    if (window.location.hash !== '#games') window.location.hash = '#games';
                }
            }
            currentPage = pageFromHash;
            
            // gamesPerPage is already initialized from localStorage or default
            if (itemsPerPageSelect) gamesPerPage = parseInt(itemsPerPageSelect.value, 10); // Sync with select if it changed

            showSection(gamesListSection);
            gameListStats.style.display = 'block';
            paginationControlsContainer.style.display = 'flex';
            filterAndPopulateGameList(); // This will use the `currentPage` set from hash
            if (navGamesButton) {
                navGamesButton.classList.add('active');
                navGamesButton.setAttribute('aria-pressed', 'true');
            }
        } else if (hash === '#about' || hash === '') {
            // ... (about routing)
            showSection(aboutSection);
            if (navAboutButton) {
                navAboutButton.classList.add('active');
                navAboutButton.setAttribute('aria-pressed', 'true');
            }
            if (hash === '') window.location.hash = '#about';
        } else {
            // ... (unknown hash routing)
            console.warn(`Unknown hash: ${hash}. Redirecting to about.`);
            showSection(aboutSection);
            if (navAboutButton) {
                navAboutButton.classList.add('active');
                navAboutButton.setAttribute('aria-pressed', 'true');
            }
            if (window.location.hash !== '#about') window.location.hash = '#about';
        }
    }

    if (navAboutButton) {
        navAboutButton.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#about'; });
    }

    if (navGamesButton) {
        navGamesButton.addEventListener('click', (e) => {
            e.preventDefault();
            if (searchBar) searchBar.value = '';
            if (sortSelect) sortSelect.value = 'original';
            
            gamesPerPage = DEFAULT_ITEMS_PER_PAGE; // Reset items per page logic
            if (itemsPerPageSelect) itemsPerPageSelect.value = gamesPerPage.toString();
            localStorage.setItem(ITEMS_PER_PAGE_STORAGE_KEY, gamesPerPage.toString());
            
            // Navigate to base #games, which implies page 1
            window.location.hash = '#games';
        });
    }

    if (backToListButton) {
        backToListButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back(); // Use browser history to go back
        });
    }
    

    if (searchBar) {
        searchBar.addEventListener('input', () => {
            // When search changes, go to page 1 of new results
            // Update hash to #games (or #games/page/1 if you prefer explicit page 1 always)
            if (window.location.hash.startsWith("#games/page/")) {
                window.location.hash = "#games"; // This will trigger route change to page 1
            } else {
                currentPage = 1; // If already on #games, just reset internal page
                filterAndPopulateGameList();
            }
        });
    }
    
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            // When sort changes, go to page 1
            if (window.location.hash.startsWith("#games/page/")) {
                window.location.hash = "#games";
            } else {
                currentPage = 1;
                filterAndPopulateGameList();
            }
        });
    }

    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (event) => {
            gamesPerPage = parseInt(event.target.value, 10);
            localStorage.setItem(ITEMS_PER_PAGE_STORAGE_KEY, gamesPerPage.toString());
            // When items per page changes, go to page 1
            if (window.location.hash.startsWith("#games/page/")) {
                window.location.hash = "#games";
            } else {
                currentPage = 1;
                filterAndPopulateGameList();
            }
        });
    }

    loadGameData();
    window.addEventListener('hashchange', handleRouteChange);
});