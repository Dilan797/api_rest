//Creando una Api_rest
const express = require('express');
//Llamamos biblioteca que te permite crear id's de forma automatizada
const crypto = require('crypto');
//Importamos movies.json
const movies = require('./movies.json');
const cors = require('cors')//Insertamos cors
const { validateMovie, validatePartialMovie } = require('./schemas/movies');
const { callbackify } = require('util');

//Creamos nuestro xpress
const app = express();
app.use(express.json());//Llamamos el midelware
//Insertamos cors para aceptar la solicitud de borrado 
//y conectado a la lista del origen
app.use(cors({
    origin:(origin, callback) => {
        //Lista para detectar el origin
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://localhost:1234',
            'http://movies.com',
            'http://dilan.dev',
        ]
        //Si el origin esta en la lista de aceptados
        if(ACCEPTED_ORIGINS.includes(origin)){
            return callback(null, true)
        }
        //Si no esta en la lista de aceptados
        if (!origin){
            return callback(null, true)
        }
        return callback(new Error('Not allowed by CORS'))
    }
}));
app.disable('x-powered-by');//Desabilitar el header x-Powered-By: Express


// Middleware para manejar CORS
app.use((req, res, next) => {
    const origin = req.header('origin');
    if (ACCEPTED_ORIGINS.includes(origin) || !origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');
    next();
});

//se utiliza para definir una ruta que maneja solicitudes HTTP GET.
//Una solicitud GET se utiliza típicamente para obtener datos del servidor. En este caso,
//la ruta definida es el punto de entrada de tu aplicación web, es decir, la raíz ('/').
// app.get('/', (req,res) => {
//     res.json({message:'hola mundo'})
// })

//Todos los recursos que sean MOVIES se identifican con /movies

app.get('/movies', (req,res) => {
    // //Forma dinamica que al entrar se da el puerto exacto
    // const origin = req.header('origin')
    // if (ACCEPTED_ORIGINS.includes(origin) || !origin){
    //     res.header('Access-Control-Allow-Origin', origin)
    // }
    //Recuperar las peliculos por genero
    const {genre} = req.query
    if (genre) {
        const filteredMovies = movies.filter
        //Para verificar si una película pertenece a un género específico
        (movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase()));
        return res.json(filteredMovies)
    }
    res.json(movies)
})
//Para recuperar una pelicula, segmento dinamico
//parametro de la url para acceder a una id
app.get('/movies/:id', (req,res) => {
    const {id} = req.params
    //Recuperamos la pelicula
    const movie = movies.find(movie => movie.id === id);
    //Si no existe la pelicula
    if(movie) return res.json(movie);
    res.status(404).json({message: 'Movie not found'})
})

//Creamos un POST, usamos el mismo recurso 'movies'
app.post('/movies' , (req,res) => {
    //Validamos el reques.body
    const result = validateMovie(req.body)
    
    if (!result.success){
        return res.status(400).json({ error: JSON.parse(result.error.message)})
    }

    //Traemos el cuerpo de la request
    // const{
    //     title,
    //     genre,
    //     year,
    //     director,
    //     duration,
    //     rate, 
    //     poster
    // } = req.body;
    //Creamos un nuevo objeto:
    const newMovie = {
        id: crypto.randomUUID(),//Creamos un UUID V4
        ...result.data 
    }    
    //Mutamos
    movies.push(newMovie);
    //Indicamos como se ha creado el recurso
    res.status(201).json(newMovie)//actualizar cache del cliente
});
//Creamos el delete
app.delete('/movies/:id', (req,res) => {
    // //Forma dinamica que al entrar se da el puerto exacto
    // const origin = req.header('origin')
    // if (ACCEPTED_ORIGINS.includes(origin) || !origin){
    //     res.header('Access-Control-Allow-Origin', origin)
    // }

    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)


    if(movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'})
    }
    movies.splice(movieIndex, 1)

    return res.json({ message: 'Movie deleted'})
})


//Creamos PATCH
app.patch('/movies/:id', (req,res) =>{
    const result = validatePartialMovie(req.body)
    if (!result.success){
        return res.status(400).json({error: JSON.parse(result.error.message)})
    }
    
    const {id} = req.params//Recuperamos la id
    const movieIndex = movies.findIndex(movie => movie.id === id);//Buscamos la pelicula

    if (movieIndex === -1){
        return res.status(404).json ({message: 'Movie not found'});//Si no encontramos la pelicula

    }
    const updateMovie = {
        ...movies[movieIndex],
        ...result.data
    }
    movies[movieIndex]= updateMovie
    //Devolvemos el json de una pelicula actualizada 
    return res.json(updateMovie)
})
//Sección logica para borrar mi elemento 
app.options('/movies/:id', (req,res) => {
    //Forma dinamica que al entrar se da el puerto exacto
    const origin = req.header('origin')
    if (ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    res.send(200)
})


const PORT = process.env.PORT ?? 1234;

//Escuchar en el puerto
app.listen(PORT, () => {
    console.log(`Escuchando en el puerto ${PORT}`)
});
