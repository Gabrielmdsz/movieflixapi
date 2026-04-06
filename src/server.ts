import express from "express";
import { PrismaClient } from "@prisma/client";
import swaggerUi from "swagger-ui-express";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const swaggerDocument = require("../swagger.json");

const prisma = new PrismaClient();
const port = 3000;
const app = express();

app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get("/movies", async (req, res) => {
    const movies = await prisma.movie.findMany({
        orderBy: {
            title: "asc",
        },
        include: {
            genres: true,
            languages: true,
        },
    });
    res.json(movies);
});

app.post("/movies", async (req, res) => {
    const { title, genre_id, language_id, oscar_count, release_date } =
        req.body;
    try {
        const movieWithSameTitle = await prisma.movie.findFirst({
            where: {
                title: { equals: title, mode: "insensitive" },
            },
        });

        if (movieWithSameTitle) {
            return res
                .status(409)
                .send({ message: "Já existe um filme com esse título" });
        }

        await prisma.movie.create({
            data: {
                title,
                genre_id,
                language_id,
                oscar_count,
                release_date: new Date(release_date),
            },
        });
    } catch (error) {
        return res.status(500).send({ message: "Falha ao cadastrar um filme" });
    }

    res.status(201).send();
});

app.put("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        const data = { ...req.body };
        data.release_date = data.release_date
            ? new Date(data.release_date)
            : undefined;

        await prisma.movie.update({ where: { id }, data });
    } catch (error) {
        return res
            .status(500)
            .send({ message: "Falha ao atualizar o registro" });
    }
    res.status(200).send();
});

app.put("/genres/:id", async (req, res) => {
    const id = req.params;
    const name = req.body;

    if (!name) {
        return res
            .status(400)
            .send({ message: "O nome do gênero é obrigatorio" });
    }

    try {
        const genre = await prisma.genre.findUnique({
            where: { id: Number(id) },
        });

        if (!genre) {
            return res.status(404).send({ message: "Gênero não encontrado." });
        }

        const existGenre = await prisma.genre.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
                id: { not: Number(id) },
            },
        });

        if (existGenre) {
            return res.status(400).send({ message: "Esse gênero ja existe" });
        }

        const updateGenre = await prisma.genre.update({
            where: { id: Number(id) },
            data: { name },
        });

        res.status(200).json(updateGenre);
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Houve um problema ao atualizar o gênero.",
        });
    }
});

app.post("/genres", async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res
            .status(400)
            .send({ message: "O nome do gênero é obrigatorio" });
    }

    try {
        const existGenre = await prisma.genre.findFirst({
            where: {
                name: { equals: name, mode: "insensitive" },
            },
        });

        if (existGenre) {
            return res
                .status(409)
                .send({ message: "Já existe um gênero com esse nome." });
        }
        const newGenre = await prisma.genre.create({
            data: {
                name,
            },
        });
        res.status(201).json(newGenre);
    } catch (error) {
        return res
            .status(500)
            .send({ message: "Falha ao cadastrar um gênero" });
    }
});

app.get("/genres", async (req, res) => {
    try {
        const genres = await prisma.genre.findMany({
        orderBy: {
            name: "asc",
        }
    });
    res.json(genres);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: "Houve um problema ao buscar os gêneros." });
    }
});

app.delete("genres/:id", async (req, res)=>{
    const id  = Number(req.params.id)

    try {
        const genre = await prisma.genre.findUnique({
            where:{ id }
        })

        if(!genre) {
            return res.status(404).send({ message: "Gênero não encontrado" });
        }

        await prisma.genre.delete({ where: { id } })
        res.status(200).send({ message: "Gênero removido com sucesso." });
    } catch (error) {
        res.status(500).send({ message: "Falha ao remover o gênero" });
    }
})


app.delete("/movies/:id", async (req, res) => {
    const id = Number(req.params.id);

    try {
        const movie = await prisma.movie.findUnique({
            where: { id },
        });

        if (!movie) {
            return res.status(404).send({ message: "Filme não encontrado" });
        }

        await prisma.movie.delete({ where: { id } });
    } catch (error) {
        res.status(500).send({ message: "Falha ao remover o registro" });
    }

    res.status(200).send();
});

app.get("/movies/:genderName", async (req, res) => {
    try {
        const moviesFilteredByGenderName = await prisma.movie.findMany({
            include: {
                genres: true,
                languages: true,
            },
            where: {
                genres: {
                    name: {
                        equals: req.params.genderName,
                        mode: "insensitive",
                    },
                },
            },
        });

        res.status(200).send(moviesFilteredByGenderName);
    } catch (error) {
        return res.status(500).send({ message: "Falha ao atualizar um filme" });
    }
});

app.listen(port, () => {
    console.log(`Servidor em execução em http://localhost:${port}`);
});
