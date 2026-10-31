import { Request, Response } from "express";
import { Luminosidade } from "@prisma/client";
import * as PlantaRepository from "@repositories/PlantaRepository";

const CAMPOS_OBRIGATORIOS = [
    "nome",
    "especie",
    "preco",
    "estoque",
    "luminosidade",
    "petFriendly",
    "regaACadaDias",
];

const isLuminosidade = (valor: unknown): valor is Luminosidade => {
    return Object.values(Luminosidade).includes(valor as Luminosidade);
};

const lerId = (valor: string): number | null => {
    const id = Number(valor);
    return Number.isInteger(id) && id > 0 ? id : null;
};

const montarDados = (body: any) => {
    return {
        nome: body.nome,
        especie: body.especie,
        preco: body.preco,
        estoque: body.estoque,
        luminosidade: body.luminosidade,
        petFriendly: body.petFriendly,
        regaACadaDias: body.regaACadaDias,
    };
};

const validarPlanta = (body: any, completo: boolean): string | null => {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        return "O corpo da requisição deve ser um objeto JSON";
    }

    if (completo) {
        for (const campo of CAMPOS_OBRIGATORIOS) {
            if (body[campo] === undefined) {
                return `O campo ${campo} é obrigatório`;
            }
        }
    }

    const { nome, especie, preco, estoque, luminosidade, petFriendly, regaACadaDias } = body;

    if (nome !== undefined && (typeof nome !== "string" || nome.trim() === "")) {
        return "nome deve ser um texto não vazio";
    }
    if (especie !== undefined && (typeof especie !== "string" || especie.trim() === "")) {
        return "especie deve ser um texto não vazio";
    }
    if (preco !== undefined && (!Number.isInteger(preco) || preco <= 0)) {
        return "preco deve ser um inteiro maior que zero, em centavos";
    }
    if (estoque !== undefined && (!Number.isInteger(estoque) || estoque < 0)) {
        return "estoque deve ser um inteiro maior ou igual a zero";
    }
    if (luminosidade !== undefined && !isLuminosidade(luminosidade)) {
        return "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO";
    }
    if (petFriendly !== undefined && typeof petFriendly !== "boolean") {
        return "petFriendly deve ser true ou false";
    }
    if (regaACadaDias !== undefined && (!Number.isInteger(regaACadaDias) || regaACadaDias < 1)) {
        return "regaACadaDias deve ser um inteiro maior ou igual a 1";
    }

    return null;
};

export const createPlanta = async (req: Request, res: Response) => {
    try {
        const erro = validarPlanta(req.body, true);
        if (erro) {
            return res.status(400).json({ message: erro });
        }

        const planta = await PlantaRepository.createPlanta(montarDados(req.body));

        return res.status(201).json(planta);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao criar planta" });
    }
};

export const readAllPlantas = async (req: Request, res: Response) => {
    try {
        const { luminosidade, petFriendly } = req.query;
        const filtros: { luminosidade?: Luminosidade; petFriendly?: boolean } = {};

        if (luminosidade !== undefined) {
            if (!isLuminosidade(luminosidade)) {
                return res.status(400).json({ message: "luminosidade deve ser SOMBRA, MEIA_SOMBRA ou SOL_PLENO" });
            }
            filtros.luminosidade = luminosidade;
        }

        if (petFriendly !== undefined) {
            if (petFriendly !== "true" && petFriendly !== "false") {
                return res.status(400).json({ message: "petFriendly deve ser true ou false" });
            }
            filtros.petFriendly = petFriendly === "true";
        }

        const plantas = await PlantaRepository.findAllPlantas(filtros);
        return res.status(200).json(plantas);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar plantas" });
    }
};

export const readPlantaById = async (req: Request, res: Response) => {
    try {
        const id = lerId(req.params.id);
        if (id === null) {
            return res.status(400).json({ message: "id deve ser um inteiro maior que zero" });
        }

        const planta = await PlantaRepository.findPlantaById(id);
        if (!planta) {
            return res.status(404).json({ message: "Planta não encontrada" });
        }

        return res.status(200).json(planta);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao buscar planta" });
    }
};

export const updatePlanta = async (req: Request, res: Response) => {
    try {
        const id = lerId(req.params.id);
        if (id === null) {
            return res.status(400).json({ message: "id deve ser um inteiro maior que zero" });
        }

        const existente = await PlantaRepository.findPlantaById(id);
        if (!existente) {
            return res.status(404).json({ message: "Planta não encontrada" });
        }

        const erro = validarPlanta(req.body, false);
        if (erro) {
            return res.status(400).json({ message: erro });
        }

        const dados = montarDados(req.body);
        if (Object.values(dados).every((valor) => valor === undefined)) {
            return res.status(400).json({ message: "Envie ao menos um campo para editar" });
        }

        const planta = await PlantaRepository.updatePlanta(id, dados);
        return res.status(200).json(planta);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao atualizar planta" });
    }
};

export const deletePlanta = async (req: Request, res: Response) => {
    try {
        const id = lerId(req.params.id);
        if (id === null) {
            return res.status(400).json({ message: "id deve ser um inteiro maior que zero" });
        }

        const existente = await PlantaRepository.findPlantaById(id);
        if (!existente) {
            return res.status(404).json({ message: "Planta não encontrada" });
        }

        await PlantaRepository.deletePlanta(id);
        return res.status(204).send();
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao deletar planta" });
    }
};


export const venderPlanta = async (req: Request, res: Response) => {
    try {
        const id = lerId(req.params.id);
        if (id === null) {
            return res.status(400).json({ message: "id deve ser um inteiro maior que zero" });
        }
        const quantidade = req.body?.quantidade;
        if (!Number.isInteger(quantidade) || quantidade <= 0) {
            return res.status(400).json({ message: "quantidade deve ser um inteiro maior que zero" });
        }
        const planta = await PlantaRepository.findPlantaById(id);
        if (!planta) {
            return res.status(404).json({ message: "Planta não encontrada" });
        }
        if (planta.estoque < quantidade) {
            return res.status(400).json({ message: `Temos só ${planta.estoque} vasos` });
        }
        const alterados = await PlantaRepository.decrementEstoque(id, quantidade);
        if (alterados === 0) {
            return res.status(400).json({ message: "Estoque insuficiente" });
        }
        const atualizada = await PlantaRepository.findPlantaById(id);
        return res.status(200).json(atualizada);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao vender planta" });
    }
};

export const readValorTotalEstoque = async (req: Request, res: Response) => {
    try {
        const plantas = await PlantaRepository.findAllPrecoEstoque();
        const valorTotalEmCentavos = plantas.reduce((total, planta) => total + planta.preco * planta.estoque, 0);
        const totalDeVasos = plantas.reduce((total, planta) => total + planta.estoque, 0);
        return res.status(200).json({ valorTotalEmCentavos, totalDeVasos });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Erro ao calcular o valor do estoque" });
    }
};