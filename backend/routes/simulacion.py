from fastapi import APIRouter
from pydantic import BaseModel
from typing import Any
from services import simulador
from services import generadorNumeros
import random

router = APIRouter()

class ParametrosSimulacion(BaseModel):
    replicaciones: int = 10
    tiempo_simulacion: float = 480  
    semilla: int = 42
    tasa_llegada: float = 20


class ResultadoGrupo(BaseModel):
    id: int
    maquinas: int
    utilizacion: float        
    espera_promedio: float   
    cola_promedio: float


class ResultadoSimulacion(BaseModel):
    throughput: float
    tiempo_total: float
    grupos: list[ResultadoGrupo]
    comparativa: list[Any]
    log_eventos: list[Any] = []  


class ParametrosGenerador(BaseModel):
    semilla: int
    cantidad: int
    modulo: int
    multiplicador: int
    incremento: int




@router.post("/simular", response_model=ResultadoSimulacion)
def simular(params: ParametrosSimulacion):
    resultado = simulador.ejecutar(params)
    return resultado



@router.post("/generar")
def generar(params: ParametrosGenerador):
    numeros = generadorNumeros.generar_numeros_congurencia_lineal(
        params.semilla,
        params.cantidad,
        params.modulo,
        params.multiplicador,
        params.incremento,
    )
    normalizados = [n / params.modulo for n in numeros]
    return {
        "numeros_crudos": numeros,
        "numeros_normalizados": normalizados,
        "cantidad": len(numeros),
    }


@router.post("/verificar-parametros")
def verificar_parametros(params: ParametrosGenerador):

    resultado = generadorNumeros.verificador_parametros_generador(
        params.semilla,
        params.cantidad,
        params.modulo,
        params.multiplicador,
        params.incremento,
    )
    return resultado


@router.get("/generar-parametros/{cantidad}")
def generar_parametros(cantidad: int):
    return generadorNumeros.generar_parametros_apartir_de_cantidad(cantidad)

@router.get("/semilla-aleatoria")
def semilla_aleatoria():
    return {"semilla": random.randint(1, 99999)}
