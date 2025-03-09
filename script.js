const API_KEY = '';

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const moviesContainer = document.getElementById('movies-container');
const watchlistContainer = document.getElementById('watchlist-container');
const movieDetails = document.getElementById('movie-details');
const loading = document.getElementById('loading');
const noResults = document.getElementById('no-results');
const modal = document.getElementById('movie-modal');
const modalContent = document.getElementById('modal-content');
const closeModal = document.querySelector('.close');
const showWatchlistButton = document.getElementById('show-watchlist');
const backToSearchButton = document.getElementById('back-to-search');
const backToResultsButton = document.getElementById('back-to-results');
const resultsHeading = document.getElementById('results-heading');
const watchlistHeading = document.getElementById('watchlist-heading');
const viewControls = document.getElementById('view-controls');

let currentSearchResults = [];
let watchlist = JSON.parse(localStorage.getItem('movieWatchlist')) || [];
let currentView = 'search'; 

searchButton.addEventListener('click', performSearch);
searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') performSearch();
});

closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
});

window.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

showWatchlistButton.addEventListener('click', showWatchlist);
backToSearchButton.addEventListener('click', showSearchResults);
backToResultsButton.addEventListener('click', () => {
    showSearchResults();
});

async function performSearch() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;
    
    currentView = 'search';
    updateViewState();
    
    moviesContainer.classList.add('hidden');
    watchlistContainer.classList.add('hidden');
    movieDetails.classList.add('hidden');
    watchlistHeading.classList.add('hidden');
    resultsHeading.classList.add('hidden');
    noResults.classList.add('hidden');
    loading.classList.remove('hidden');
    
    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(searchTerm)}&apikey=${API_KEY}`);
        const data = await response.json();
        
        if (data.Response === 'True' && data.Search && data.Search.length > 0) {
            currentSearchResults = data.Search;
            displayMovies(currentSearchResults, moviesContainer);
            resultsHeading.classList.remove('hidden');
            moviesContainer.classList.remove('hidden');
        } else {
            currentSearchResults = [];
            moviesContainer.innerHTML = '';
            noResults.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        noResults.classList.remove('hidden');
    } finally {
        loading.classList.add('hidden');
    }
}

function displayMovies(movies, container) {
    container.innerHTML = '';
    
    movies.forEach(movie => {
        const isInWatchlist = watchlist.some(item => item.imdbID === movie.imdbID);
        
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card slide-in-up';
        movieCard.style.animationDelay = `${movies.indexOf(movie) * 0.05}s`;
        
        const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
        
        movieCard.innerHTML = `
            <div class="movie-poster-container">
                <img class="movie-poster" src="${posterUrl}" alt="${movie.Title} poster">
                <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" data-id="${movie.imdbID}">
                    <i class="fas ${isInWatchlist ? 'fa-bookmark' : 'fa-bookmark'}"></i>
                </button>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${movie.Title}</h3>
                <div class="movie-year">
                    <i class="far fa-calendar-alt"></i>
                    ${movie.Year}
                </div>
            </div>
        `;
        
        container.appendChild(movieCard);
        

        movieCard.querySelector('.movie-poster-container').addEventListener('click', () => {
            fetchMovieDetails(movie.imdbID);
        });
        
        movieCard.querySelector('.movie-info').addEventListener('click', () => {
            fetchMovieDetails(movie.imdbID);
        });
        
        movieCard.querySelector('.watchlist-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            toggleWatchlist(movie);
            
            const button = e.currentTarget;
            if (button.classList.contains('active')) {
                button.classList.remove('active');
                button.innerHTML = '<i class="fas fa-bookmark"></i>';
            } else {
                button.classList.add('active');
                button.innerHTML = '<i class="fas fa-bookmark"></i>';
            }
        });
    });
}

async function fetchMovieDetails(imdbID) {
    moviesContainer.classList.add('hidden');
    watchlistContainer.classList.add('hidden');
    watchlistHeading.classList.add('hidden');
    resultsHeading.classList.add('hidden');
    noResults.classList.add('hidden');
    loading.classList.remove('hidden');
    viewControls.classList.remove('hidden');
    
    if (currentView === 'search') {
        backToResultsButton.classList.remove('hidden');
        backToSearchButton.classList.add('hidden');
    } else {
        backToResultsButton.classList.add('hidden');
        backToSearchButton.classList.remove('hidden');
    }
    
    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${imdbID}&plot=full&apikey=${API_KEY}`);
        const movie = await response.json();
        
        if (movie.Response === 'True') {
            displayMovieDetails(movie);
            currentView = 'details';
        } else {
            showSearchResults();
        }
    } catch (error) {
        console.error('Error fetching movie details:', error);
        showSearchResults();
    } finally {
        loading.classList.add('hidden');
    }
}

function displayMovieDetails(movie) {
    const isInWatchlist = watchlist.some(item => item.imdbID === movie.imdbID);
    
    const posterUrl = movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/300x450?text=No+Poster';
    
    let ratingsHTML = '';
    if (movie.Ratings && movie.Ratings.length > 0) {
        movie.Ratings.forEach(rating => {
            let iconClass = 'fa-star';
            if (rating.Source.includes('Rotten')) {
                iconClass = 'fa-tomato';
            } else if (rating.Source.includes('Metacritic')) {
                iconClass = 'fa-square';
            }
            
            ratingsHTML += `
                <div class="rating-box">
                    <i class="fas ${iconClass}"></i>
                    <div>
                        <span>${rating.Value}</span>
                        <span class="rating-source">${rating.Source}</span>
                    </div>
                </div>
            `;
        });
    }
    
    let genresHTML = '';
    if (movie.Genre) {
        const genres = movie.Genre.split(', ');
        genres.forEach(genre => {
            genresHTML += `<div class="genre-tag">${genre}</div>`;
        });
    }
    
    modalContent.innerHTML = `
        <div class="movie-detail-container">
            <div class="movie-detail-banner">
                <img class="movie-detail-backdrop" src="${posterUrl}" alt="${movie.Title} backdrop">
            </div>
            
            <div class="movie-detail-poster-container">
                <img class="movie-detail-poster" src="${posterUrl}" alt="${movie.Title} poster">
            </div>
            
            <div class="movie-detail-info">
                <div class="movie-detail-header">
                    <h2 class="movie-detail-title">${movie.Title}</h2>
                    
                    <div class="movie-detail-meta">
                        ${movie.Year ? `
                            <div class="movie-meta-item">
                                <i class="far fa-calendar-alt"></i>
                                ${movie.Year}
                            </div>
                        ` : ''}
                        
                        ${movie.Runtime && movie.Runtime !== 'N/A' ? `
                            <div class="movie-meta-item">
                                <i class="far fa-clock"></i>
                                ${movie.Runtime}
                            </div>
                        ` : ''}
                        
                        ${movie.Rated && movie.Rated !== 'N/A' ? `
                            <div class="movie-meta-item">
                                <i class="fas fa-film"></i>
                                ${movie.Rated}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="genres-list">
                        ${genresHTML}
                    </div>
                </div>
                
                ${movie.Plot && movie.Plot !== 'N/A' ? `
                    <div class="movie-detail-plot">
                        ${movie.Plot}
                    </div>
                ` : ''}
                
                <div class="movie-detail-ratings">
                    ${ratingsHTML}
                </div>
                
                <div class="divider"></div>
                
                ${movie.Director && movie.Director !== 'N/A' ? `
                    <div class="movie-detail-section">
                        <h3><i class="fas fa-video"></i> Director</h3>
                        <div class="crew-list">
                            <div class="crew-item">
                                <div class="crew-role">Director</div>
                                <div class="crew-name">${movie.Director}</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${movie.Writer && movie.Writer !== 'N/A' ? `
                    <div class="movie-detail-section">
                        <h3><i class="fas fa-pen-fancy"></i> Writers</h3>
                        <div class="crew-list">
                            ${movie.Writer.split(', ').map(writer => `
                                <div class="crew-item">
                                    <div class="crew-role">Writer</div>
                                    <div class="crew-name">${writer}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${movie.Actors && movie.Actors !== 'N/A' ? `
                    <div class="movie-detail-section">
                        <h3><i class="fas fa-users"></i> Cast</h3>
                        <div class="cast-list">
                            ${movie.Actors.split(', ').map(actor => `
                                <div class="cast-item">
                                    <div class="cast-role">Actor</div>
                                    <div class="cast-name">${actor}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <button class="watchlist-btn-large ${isInWatchlist ? 'active' : ''}" data-id="${movie.imdbID}">
                    <i class="fas ${isInWatchlist ? 'fa-check' : 'fa-plus'}"></i>
                    ${isInWatchlist ? 'REMOVE FROM WATCHLIST' : 'ADD TO WATCHLIST'}
                </button>
            </div>
        </div>
    `;
    

    modalContent.querySelector('.watchlist-btn-large').addEventListener('click', () => {
        toggleWatchlist(movie);
        const button = modalContent.querySelector('.watchlist-btn-large');
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            button.innerHTML = '<i class="fas fa-plus"></i> ADD TO WATCHLIST';
        } else {
            button.classList.add('active');
            button.innerHTML = '<i class="fas fa-check"></i> REMOVE FROM WATCHLIST';
        }
    });
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden'; 
}

function toggleWatchlist(movie) {
    const index = watchlist.findIndex(item => item.imdbID === movie.imdbID);
    
    if (index === -1) {
        watchlist.push(movie);
    } else {
        watchlist.splice(index, 1);
    }
    
    localStorage.setItem('movieWatchlist', JSON.stringify(watchlist));
    
    if (currentView === 'watchlist') {
        displayMovies(watchlist, watchlistContainer);
        if (watchlist.length === 0) {
            watchlistContainer.innerHTML = `
                <div class="no-movies-message">
                    <i class="far fa-bookmark"></i>
                    <h3>Your watchlist is empty</h3>
                    <p>Movies you add to your watchlist will appear here</p>
                </div>
            `;
        }
    }
}

function showWatchlist() {
    currentView = 'watchlist';
    updateViewState();
    
    moviesContainer.classList.add('hidden');
    movieDetails.classList.add('hidden');
    noResults.classList.add('hidden');
    resultsHeading.classList.add('hidden');
    watchlistHeading.classList.remove('hidden');
    watchlistContainer.classList.remove('hidden');
    
    if (watchlist.length > 0) {
        displayMovies(watchlist, watchlistContainer);
    } else {
        watchlistContainer.innerHTML = `
            <div class="no-movies-message" style="text-align: center; margin-top: 3rem;">
                <i class="far fa-bookmark" style="font-size: 3rem; color: var(--medium-gray); margin-bottom: 1rem;"></i>
                <h3 style="font-size: 1.5rem; color: var(--dark-bg); margin-bottom: 0.5rem;">Your watchlist is empty</h3>
                <p style="color: var(--medium-gray);">Movies you add to your watchlist will appear here</p>
            </div>
        `;
    }
}

function showSearchResults() {
    currentView = 'search';
    updateViewState();
    
    watchlistContainer.classList.add('hidden');
    movieDetails.classList.add('hidden');
    watchlistHeading.classList.add('hidden');
    
    if (currentSearchResults.length > 0) {
        moviesContainer.classList.remove('hidden');
        resultsHeading.classList.remove('hidden');
        noResults.classList.add('hidden');
    } else {
        if (searchInput.value.trim()) {
            noResults.classList.remove('hidden');
        }
    }
}

function updateViewState() {
    viewControls.classList.add('hidden');
    backToSearchButton.classList.add('hidden');
    backToResultsButton.classList.add('hidden');
    
    if (currentView === 'search') {
        showWatchlistButton.querySelector('span').textContent = 'WATCHLIST';
    } else if (currentView === 'watchlist') {
        showWatchlistButton.querySelector('span').textContent = 'SEARCH';
        if (currentSearchResults.length > 0) {
            viewControls.classList.remove('hidden');
            backToSearchButton.classList.remove('hidden');
        }
    } else if (currentView === 'details') {
        viewControls.classList.remove('hidden');
        if (currentView === 'search') {
            backToResultsButton.classList.remove('hidden');
        } else {
            backToSearchButton.classList.remove('hidden');
        }
    }
}

function init() {
    showSearchResults();
    
    if (currentSearchResults.length === 0 && searchInput.value.trim() === '') {
        moviesContainer.innerHTML = `
            <div class="welcome-message" style="text-align: center; grid-column: 1 / -1; margin: 3rem 0;">
                <i class="fas fa-film" style="font-size: 3rem; color: var(--primary-red); margin-bottom: 1rem;"></i>
                <h3 style="font-size: 1.8rem; color: var(--dark-bg); margin-bottom: 0.5rem;">Welcome to Cinefy</h3>
                <p style="color: var(--medium-gray); max-width: 600px; margin: 0 auto;">
                    Search for any movie to get started. You can add movies to your watchlist and view detailed information.
                </p>
            </div>
        `;
    }
}

document.addEventListener('DOMContentLoaded', init);