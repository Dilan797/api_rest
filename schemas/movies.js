//Llamamos al zod validaciones de datos
const z = require('zod');
//Creamos un movie schema validation
const movieSchema = z.object({
    title:z.string({
        invalid_type_error: 'Movie title must be a string',
        required_error: 'Movie title is required.'
    }),
    year: z.number().int().min(1900).max(2024),
    director: z.string(),
    duration: z.number().int().positive(),
    //Ponemos un valor default en rate para crear un valor optional 
    //y cargue le validación POST
    rate: z.number().min().max(10).default(5),
    poster: z.string().url({
        message: 'Movie poster must be a valid URL'
    }),
    genre:z.array(
        z.enum(['Action', 'Adventure','Comedy', 'Drama', 'Fantasy','Biography', 'Crime', 'Error', 'Thriller', 'Sci-Fi']),
        {
            require_error: 'Movie genre is required',
            invalid_type_error: 'Movie genre must be a string'
        }        
    )

})
//Creamos una función 
function validateMovie(input){
    return movieSchema.safeParse(input);
}
//Funcion para que todas las propiedades existentes sean opcionales
function validatePartialMovie (input){
    return movieSchema.partial().safeParse(input)  
}


//Objeto validado
module.exports ={
    validateMovie,
    validatePartialMovie
}