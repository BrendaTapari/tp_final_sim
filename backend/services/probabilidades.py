MANUFACTURA = {
    "tipo_1": {
        "secuencia": [3, 1, 2],
        "tiempos": [0.5, 0.8, 0.8],
        "probabilidad": 0.3,
        "lim_inferior": 0.0,
        "lim_superior": 0.3
    },
    "tipo_2": {
        "secuencia": [4, 1, 3],
        "tiempos": [1.1, 0.8, 0.75],
        "probabilidad": 0.4,
        "lim_inferior": 0.3,
        "lim_superior": 0.7
    },
    "tipo_3": {
        "secuencia": [2, 5, 1, 4, 3],
        "tiempos": [1.9, 0.25, 0.7, 0.9, 1.0],
        "probabilidad": 0.1,
        "lim_inferior": 0.7,
        "lim_superior": 0.8
    },
    "tipo_4": {
        "secuencia": [1, 5, 4],
        "tiempos": [1.4, 1.8, 0.4],
        "probabilidad": 0.2,
        "lim_inferior": 0.8,
        "lim_superior": 1.0
    }
}


def obtener_tipo_manufactura(numero_aleatorio):

    for tipo in MANUFACTURA.values():
        if tipo["lim_inferior"] <= numero_aleatorio < tipo["lim_superior"]:
            return tipo
    return None
