const express = require('express');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const port = 3000;

// ==================================================================
// SISTEMA DE CACHE (MEMÓRIA)
// Aqui nós "enganamos" o servidor fingindo que ele já buscou os dados.
// ==================================================================
const CACHE_DURATION = 1000 * 60 * 60 * 4; // 4 Horas

const movieCache = {
    // 1. O Maravilhoso Mágico de Oz - Parte 1
    '658224': { 
        url: 'https://superflixapi.asia/filme/tt24218194', 
        timestamp: Date.now() 
    },
    // 2. Ameaça no Ar (Flight Risk) - Recuperado dos seus logs antigos
    '1126166': {
        url: 'https://superflixapi.asia/filme/tt10078772',
        timestamp: Date.now()
    },

    '1054867': {
        url: 'https://superflixapi.asia/filme/tt30144839',
        timestamp: Date.now()
    }
    // SE VOCÊ PEGAR UM NOVO LINK NO CELULAR, ADICIONE AQUI ASSIM:
    // 'ID_DO_TMDB': { url: 'LINK_DO_IFRAME', timestamp: Date.now() },
}; 

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================================================================
// ENDPOINT DA API
// ==================================================================
app.get('/api/get-movie-link/:tmdbId', async (req, res) => {
  const { tmdbId } = req.params;

  // 1. VERIFICA SE JÁ TEMOS O LINK NA MEMÓRIA (CACHE)
  if (movieCache[tmdbId]) {
      const cachedData = movieCache[tmdbId];
      const now = Date.now();
      // Se o link ainda é recente (menos de 4 horas), usa ele e não incomoda a API
      if (now - cachedData.timestamp < CACHE_DURATION) {
          console.log(`\n--- RECUPERADO DO CACHE (SEM API) PARA TMDB ID: ${tmdbId} ---`);
          return res.json({ success: true, url: cachedData.url });
      }
  }

  // Se não tem no cache, vamos tentar buscar na API (sujeito a bloqueio 429)
  const playerPageUrl = `https://telaflixapi.com/e/${tmdbId}`;
  console.log(`\n--- BUSCANDO NA API (SEM CACHE) PARA TMDB ID: ${tmdbId} ---`);

  try {
    // Adiciona um delay aleatório para parecer humano
    await new Promise(r => setTimeout(r, Math.random() * 1500));

    // --- ETAPA 1: PEGAR OS IDs ---
    const pageResponse = await axios.get(playerPageUrl, {
      headers: { 
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', 
          'Referer': 'https://www.google.com/' 
      }
    });
    
    const $ = cheerio.load(pageResponse.data);
    const movieId = $('#embed-player').attr('data-movie-id');
    const serverId = $('.server.dropdown-item').first().attr('data-id');

    if (!movieId || !serverId) {
      console.log(`Filme não encontrado na API externa.`);
      throw new Error('Filme não disponível na API externa ou ID incorreto.');
    }
    console.log(`1. IDs encontrados -> MovieID: ${movieId}, ServerID: ${serverId}`);

    // --- ETAPA 2: CHAMADA AJAX ---
    const ajaxUrl = `https://telaflixapi.com/ajax/get_stream_link?id=${serverId}&movie=${movieId}&is_init=true`;
    const ajaxResponse = await axios.get(ajaxUrl, {
        headers: { 'Referer': playerPageUrl, 'X-Requested-With': 'XMLHttpRequest' }
    });

    if (!ajaxResponse.data.success || !ajaxResponse.data.data.link) {
      throw new Error('A API não retornou um link intermediário válido.');
    }
    const intermediateLink = ajaxResponse.data.data.link;
    console.log(`2. Link intermediário: ${intermediateLink}`);

    // --- ETAPA 3: EXTRAIR LINK FINAL DO SCRIPT ---
    const finalPageResponse = await axios.get(intermediateLink, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36', 'Referer': playerPageUrl }
    });
    const $final = cheerio.load(finalPageResponse.data);

    let scriptContent = '';
    $final('script').each((index, element) => {
      const script = $(element).html();
      if (script && script.includes('var singleEmbed')) {
        scriptContent = script;
        return false;
      }
    });

    if (!scriptContent) {
        throw new Error('Script do player final não encontrado.');
    }

    // Regex robusta para pegar a URL (com ou sem aspas escapadas)
    const urlMatch = scriptContent.match(/<iframe src=\\"([^"]+)\\"/);

    if (!urlMatch || !urlMatch[1]) {
        throw new Error('URL não encontrada dentro do script.');
    }

    const finalUrl = urlMatch[1];
    console.log(`3. SUCESSO! Link final: ${finalUrl}`);
    
    // SALVA NO CACHE PARA A PRÓXIMA
    movieCache[tmdbId] = {
        url: finalUrl,
        timestamp: Date.now()
    };

    res.json({ success: true, url: finalUrl });

  } catch (error) {
    // Tratamento específico para o Bloqueio 429
    if (error.response && error.response.status === 429) {
        console.error('--- ERRO 429: BLOQUEIO TEMPORÁRIO DA API ---');
        return res.status(429).json({ success: false, message: 'Muitas requisições. Tente novamente em 30 min ou use o Cache Manual.' });
    }

    console.error('Erro:', error.message);
    res.status(500).json({ success: false, message: error.message || 'Erro no servidor.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});