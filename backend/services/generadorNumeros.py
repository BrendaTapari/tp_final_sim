from math import gcd


def generar_numeros_congurencia_lineal(semilla, cantidad, modulo, multiplicador, incremento):
    verificador_parametros_generador(semilla, cantidad, modulo, multiplicador, incremento)
    numeros = []
    for _ in range(cantidad):
        semilla = (multiplicador * semilla + incremento) % modulo
        numeros.append(semilla)
    return numeros


def _es_potencia_de_2(n):
    """Retorna True si n es de la forma 2^g con g entero positivo (2, 4, 8, 16, ...)."""
    return n >= 2 and (n & (n - 1)) == 0


def _encontrar_g(n):
    """Retorna el exponente g tal que n == 2^g, o None si no existe."""
    g = 0
    while n > 1:
        if n % 2 != 0:
            return None
        n //= 2
        g += 1
    return g



def verificador_parametros_generador(semilla, cantidad, modulo, multiplicador, incremento):
    """
    Condiciones verificadas:
      1. Todos los valores son enteros >= 0.
      2. El módulo es de la forma 2^g  (g entero positivo).
      3. El multiplicador es de la forma 1 + 4k  (k entero positivo, es decir > 1).
      4. El incremento es relativamente primo al módulo  (mcd = 1).

    """

    parametros = [
        ("semilla",       semilla),
        ("cantidad",      cantidad),
        ("modulo",        modulo),
        ("multiplicador", multiplicador),
        ("incremento",    incremento),
    ]
    for nombre, valor in parametros:
        if not isinstance(valor, int):
            raise TypeError(
                f"El parámetro '{nombre}' debe ser un número entero. "
                f"Se recibió: {type(valor).__name__}"
            )
        if valor < 0:
            raise ValueError(
                f"El parámetro '{nombre}' debe ser mayor o igual a 0. "
                f"Se recibió: {valor}"
            )

    if not _es_potencia_de_2(modulo):
        raise ValueError(
            f"El módulo debe ser de la forma 2^g con g entero positivo "
            f"(ej: 2, 4, 8, 16, 32, ...). Se recibió: {modulo}"
        )

    g = _encontrar_g(modulo)

    if multiplicador <= 1 or (multiplicador - 1) % 4 != 0:
        raise ValueError(
            f"El multiplicador debe ser de la forma 1 + 4k con k entero positivo "
            f"(ej: 5, 9, 13, 17, 21, ...). Se recibió: {multiplicador}. "
            f"Verificá que (multiplicador - 1) sea divisible por 4 y multiplicador > 1."
        )

    mcd = gcd(incremento, modulo)
    if mcd != 1:
        raise ValueError(
            f"El incremento debe ser relativamente primo al módulo "
            f"(mcd({incremento}, {modulo}) debe ser 1, pero es {mcd}). "
            f"Como el módulo es 2^{g}, el incremento debe ser un número impar."
        )

    return {
        "valido": True,
        "modulo": f"2^{g} = {modulo}",
        "multiplicador": f"1 + 4×{(multiplicador - 1) // 4} = {multiplicador}",
        "incremento": f"{incremento} (mcd con {modulo} = 1 ✓)",
    }


def generar_parametros_apartir_de_cantidad(cantidad):
    """
    Genera automáticamente parámetros válidos para el LCG dado solo la cantidad
    de números que se quieren producir. Todos los parámetros cumplen las
    condiciones del verificador (Hull-Dobell para módulo potencia de 2).

    Estrategia:
      - módulo    : mínima potencia de 2 estrictamente mayor que `cantidad`,
                    para garantizar que el LCG pueda generar al menos esa cantidad
                    sin repetir el ciclo antes de tiempo.
      - semilla   : 0  (punto de partida neutro)
      - multiplicador: 1 + 4 * k  con k elegido para que sea ≈ raíz cuadrada
                       del módulo (buena distribución empírica).
      - incremento: primer número impar >= 7 que sea coprimo con el módulo
                    (como el módulo es potencia de 2, basta con que sea impar).

    Args:
        cantidad (int): cuántos números pseudoaleatorios se van a generar.

    Returns:
        dict con claves: semilla, cantidad, modulo, multiplicador, incremento
                         y una descripción legible de cada valor.
    """
    if not isinstance(cantidad, int) or cantidad <= 0:
        raise ValueError("La cantidad debe ser un entero positivo.")

    # ── Módulo: mínima potencia de 2 > cantidad ───────────────────────────────
    g = 1
    modulo = 2
    while modulo <= cantidad:
        g += 1
        modulo = 2 ** g

    # ── Multiplicador: 1 + 4k con k ≈ sqrt(modulo)/4 (mínimo k=1 → a=5) ──────
    import math
    k = max(1, round(math.sqrt(modulo) / 4))
    multiplicador = 1 + 4 * k
    # Asegurar que sea < módulo
    while multiplicador >= modulo:
        k -= 1
        multiplicador = 1 + 4 * k
    if k < 1:
        multiplicador = 5   # fallback mínimo válido

    # ── Incremento: primer impar >= 7 (siempre coprimo con potencia de 2) ──────
    incremento = 7   # clásico en la literatura; impar ⟹ mcd(c, 2^g) = 1

    semilla = 0

    return {
        "semilla":        semilla,
        "cantidad":       cantidad,
        "modulo":         modulo,
        "multiplicador":  multiplicador,
        "incremento":     incremento,
        # Descripción legible
        "_info": {
            "modulo":        f"2^{g} = {modulo}  (> {cantidad})",
            "multiplicador": f"1 + 4×{k} = {multiplicador}",
            "incremento":    f"{incremento}  (impar → mcd con {modulo} = 1)",
        }
    }
