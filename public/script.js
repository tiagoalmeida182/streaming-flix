document.addEventListener('DOMContentLoaded', () => {
    const mainMovieTitle = document.querySelector('#main-movie-player h1');
    const movieDetailsDiv = document.getElementById('movie-details');
    const videoPlayerDiv = document.getElementById('video-player');
    const movieGallery = document.getElementById('movie-gallery');

    // --- LISTA DE FILMES ---
    const movies = [
        { 
            tmdbId: '658224', 
            title: 'O Maravilhoso Mágico de Oz', 
            year: '2025',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/s4pK8Cpna56SbYbmFGgKyBvLj7A.jpg' 
        },
        { 
            tmdbId: '1126166', 
            title: 'Ameaça no Ar (Flight Risk)', 
            year: '2025',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/bXFAQ5fM3BkFb1y6Gz85m4UmwfP.jpg'
        },
        { 
            // Atualizei este para bater com o seu print ("Uma Batalha Após a Outra")
            tmdbId: '1054867', 
            title: 'Uma Batalha Após a Outra (Hidden Strike)', 
            year: '2023',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2peYXW6CoruehDnKJGMjl2NuaNB.jpg'
        }
    ];

    async function loadMovie(movie) {
        mainMovieTitle.textContent = `${movie.title} (${movie.year})`;
        videoPlayerDiv.innerHTML = ''; 
        movieDetailsDiv.innerHTML = `<p>Buscando link do filme, por favor aguarde...</p>`;

        try {
            const response = await fetch(`/api/get-movie-link/${movie.tmdbId}`);
            const data = await response.json();

            if (data.success) {
                const finalUrl = data.url;
                videoPlayerDiv.innerHTML = `
                    <iframe 
                        src="${finalUrl}" 
                        width="100%" 
                        height="100%" 
                        frameborder="0" 
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowfullscreen>
                    </iframe>
                `;
                movieDetailsDiv.innerHTML = `<p>Player carregado. Bom filme!</p>`;
            } else {
                throw new Error(data.message || 'Falha ao obter o link do filme.');
            }
        } catch (error) {
            console.error('Erro ao carregar o filme:', error);
            movieDetailsDiv.innerHTML = `<p style="color: red;">${error.message}</p>`;
        }
    }

    function renderMovieCards() {
        movieGallery.innerHTML = ''; 
        movies.forEach(movie => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            // AQUI ESTÁ A MÁGICA: Inserimos a tag <img> antes do texto
            card.innerHTML = `
                <img src="${movie.image}" alt="${movie.title}">
                <div class="movie-card-info">
                    <h3>${movie.title}</h3>
                    <p>${movie.year}</p>
                </div>
            `;
            
            card.addEventListener('click', () => {
                loadMovie(movie);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
            movieGallery.appendChild(card);
        });
    }

    renderMovieCards();
    
    // Carrega o primeiro filme da lista automaticamente
    if (movies.length > 0) {
        loadMovie(movies[0]); 
    }
});