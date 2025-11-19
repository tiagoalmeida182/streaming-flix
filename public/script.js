document.addEventListener('DOMContentLoaded', () => {
    const mainMovieTitle = document.querySelector('#main-movie-player h1');
    const movieDetailsDiv = document.getElementById('movie-details');
    const videoPlayerDiv = document.getElementById('video-player');
    const movieGallery = document.getElementById('movie-gallery');

    // --- LISTA DE FILMES ---
    const movies = [
        // SEUS FILMES DA API (Adicionei type: 'api' neles)
        { 
            type: 'api',
            tmdbId: '658224', 
            title: 'O Maravilhoso Mágico de Oz', 
            year: '2025',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/s4pK8Cpna56SbYbmFGgKyBvLj7A.jpg' 
        },
        { 
            type: 'api',
            tmdbId: '1126166', 
            title: 'Ameaça no Ar (Flight Risk)', 
            year: '2025',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/bXFAQ5fM3BkFb1y6Gz85m4UmwfP.jpg'
        },
        { 
            type: 'api',
            tmdbId: '1054867', 
            title: 'Uma Batalha Após a Outra (Hidden Strike)', 
            year: '2023',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/2peYXW6CoruehDnKJGMjl2NuaNB.jpg'
        },
        { 
            type: 'api',
            tmdbId: '1084199', 
            title: 'Acompanhante Perfeita', 
            year: '2025',
            image: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2/jqcMaESCbgxSlFWDOW9icz3MoiL.jpg'
        },

        // --- SEU FILME BAIXADO (GOOGLE DRIVE) ---
        { 
            type: 'drive', // Tipo diferente
            title: 'Predador Terras Selvagens', 
            year: '2025',
            // 🔴 IMPORTANTE: TROQUE O ID ABAIXO PELO ID DO SEU VÍDEO NO DRIVE
            videoUrl: 'https://drive.google.com/file/d/1hFuxdBfW60ovnlnVU0_nAh3mtFwxUY6O/preview', 
            // Escolha uma imagem para a capa
            image: 'https://m.media-amazon.com/images/M/MV5BNTYzNTE1ZjUtOWM0Yy00MmY0LTg2ZTAtMGE2MTE3ODAzN2YxXkEyXkFqcGc@._V1_.jpg'
        }
    ];

    async function loadMovie(movie) {
        mainMovieTitle.textContent = `${movie.title} (${movie.year})`;
        videoPlayerDiv.innerHTML = ''; 
        movieDetailsDiv.innerHTML = `<p>Buscando link do filme, por favor aguarde...</p>`;

        // --- LÓGICA 1: FILME DO GOOGLE DRIVE ---
        if (movie.type === 'drive') {
            console.log('Carregando Google Drive:', movie.videoUrl);
            
            videoPlayerDiv.innerHTML = `
                <iframe 
                    src="${movie.videoUrl}" 
                    width="100%" 
                    height="100%" 
                    frameborder="0" 
                    allow="autoplay; fullscreen" 
                    allowfullscreen>
                </iframe>
            `;
            movieDetailsDiv.innerHTML = `<p>Reproduzindo via Google Drive.</p>`;
            return; // Para aqui e não tenta buscar na API
        }

        // --- LÓGICA 2: FILMES DA API ---
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
            
            // Adicionei o "onerror" para garantir que, se a imagem falhar, mostre uma genérica
            card.innerHTML = `
                <img src="${movie.image}" alt="${movie.title}" onerror="this.src='https://placehold.co/600x900?text=Sem+Capa'">
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
    
    if (movies.length > 0) {
        loadMovie(movies[0]); 
    }
});