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