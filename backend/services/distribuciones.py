from math import log


def generar_numeros_exponenciales(numeros_aleatorios, media):
    return [-media * log(1 - x) for x in numeros_aleatorios]


def generar_numeros_uniformes(numeros_aleatorios, minimo, maximo):
    return [minimo + (maximo - minimo) * x for x in numeros_aleatorios]
