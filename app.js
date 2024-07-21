const express = require('express');
const crypto = require('crypto');
const movies = require('./movies.json');
const cors = require('cors');
const { validateMovie, validatePartialMovie } = require('./schemas/movies');

// Lista para detectar el origin
const ACCEPTED_ORIGINS = [
    'http://localhost:8080',
    'http://localhost:1234',
    'http://movies.com',
    'http://dilan.dev',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501' // Agregando el nuevo origen
];

// Creamos nuestro express
const app = express();
app.use(express.json()); // Llamamos el middleware

// Insertamos cors para aceptar la solicitud de borrado y conectado a la lista del origen
app.use(cors({
    origin: (origin, callback) => {
        // Si el origin está en la lista de aceptados
        if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    }
}));
app.disable('x-powered-by'); // Deshabilitar el header x-Powered-By: Express

// Middleware para manejar CORS
app.use((req, res, next) => {
    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

// Todos los recursos que sean MOVIES se identifican con /movies
app.get('/movies', (req, res) => {
    const { genre } = req.query;
    if (genre) {
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        );
        return res.json(filteredMovies);
    }
    res.json(movies);
});

// Para recuperar una pelicula, segmento dinamico
app.get('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movie = movies.find(movie => movie.id === id);
    if (movie) return res.json(movie);
    res.status(404).json({ message: 'Movie not found' });
});

// Creamos un POST, usamos el mismo recurso 'movies'
app.post('/movies', (req, res) => {
    const result = validateMovie(req.body);
    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const newMovie = {
        id: crypto.randomUUID(), // Creamos un UUID V4
        ...result.data
    };
    movies.push(newMovie);
    res.status(201).json(newMovie); // actualizar cache del cliente
});

// Creamos el delete
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movieIndex = movies.findIndex(movie => movie.id === id);

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' });
    }
    movies.splice(movieIndex, 1);
    return res.json({ message: 'Movie deleted' });
});

// Creamos PATCH
app.patch('/movies/:id', (req, res) => {
    const result = validatePartialMovie(req.body);
    if (!result.success) {
        return res.status(400).json({ error: JSON.parse(result.error.message) });
    }

    const { id } = req.params; // Recuperamos la id
    const movieIndex = movies.findIndex(movie => movie.id === id); // Buscamos la pelicula

    if (movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found' }); // Si no encontramos la pelicula
    }
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    };
    movies[movieIndex] = updateMovie;
    return res.json(updateMovie); // Devolvemos el json de una pelicula actualizada 
});

// Sección lógica para borrar mi elemento 
app.options('/movies/:id', (req, res) => {
    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    res.sendStatus(200);
});

const PORT = process.env.PORT ?? 1234;

// Escuchar en el puerto
app.listen(PORT, () => {
    console.log(`Escuchando en el puerto ${PORT}`);
});
