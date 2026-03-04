
class EstadoTrabajo:

    ESPERANDO_ATENCION = "Esperando atención"
    COMPLETADO         = "Completado"

    @staticmethod
    def en_grupo(g: int) -> str:
        """Devuelve 'En grupo N' para el grupo dado (1-indexado)."""
        return f"En grupo {g}"


class EstadoMaquina:
    LIBRE   = "Libre"
    OCUPADA = "Ocupada"

