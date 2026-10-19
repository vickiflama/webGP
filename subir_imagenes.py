"""
Sube a Cloudflare R2 las imágenes de productos (bucket webgp-imagenes).

Las claves NO van en el código. Antes de correr el script, definilas
como variables de entorno (en Windows, en la misma consola):

    set R2_ACCESS_KEY_ID=tu_access_key
    set R2_SECRET_ACCESS_KEY=tu_secret
    python subir_imagenes.py

Se puede volver a correr cuantas veces quieras: las imágenes que ya
están en el bucket se saltean, así que solo sube las nuevas.
"""
import os
import sys

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

# ==================== CONFIGURACIÓN ====================
ENDPOINT_URL = "https://bb16912e4ee9aa916221eeb95d552af5.r2.cloudflarestorage.com"
BUCKET_NAME = "webgp-imagenes"
# Carpeta "imgweb" en el Escritorio del usuario que corre el script
CARPETA_IMAGENES = os.path.join(os.path.expanduser("~"), "Desktop", "imgweb")

ACCESS_KEY_ID = os.environ.get("R2_ACCESS_KEY_ID")
SECRET_ACCESS_KEY = os.environ.get("R2_SECRET_ACCESS_KEY")

if not ACCESS_KEY_ID or not SECRET_ACCESS_KEY:
    sys.exit("Faltan las variables de entorno R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY.")

# ==================== CONEXIÓN ====================
s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)


def ya_existe(nombre):
    """True si el archivo ya está en el bucket."""
    try:
        s3.head_object(Bucket=BUCKET_NAME, Key=nombre)
        return True
    except ClientError as e:
        if e.response["Error"]["Code"] in ("404", "NoSuchKey", "NotFound"):
            return False
        raise


# ==================== SUBIDA ====================
def subir_imagenes():
    # La web busca {codigo}.png, por eso solo se suben .png
    archivos = [f for f in os.listdir(CARPETA_IMAGENES) if f.lower().endswith(".png")]
    total = len(archivos)
    print(f"Encontradas {total} imágenes en la carpeta.\n")

    subidas, salteadas, errores = 0, 0, []

    for i, nombre in enumerate(archivos, start=1):
        ruta = os.path.join(CARPETA_IMAGENES, nombre)
        try:
            if ya_existe(nombre):
                salteadas += 1
                continue
            s3.upload_file(ruta, BUCKET_NAME, nombre, ExtraArgs={"ContentType": "image/png"})
            subidas += 1
            print(f"[{i}/{total}] ✔ Subida: {nombre}")
        except Exception as e:
            errores.append((nombre, str(e)))
            print(f"[{i}/{total}] ✘ Error con {nombre}: {e}")

    print("\n--- Resumen ---")
    print(f"Subidas ahora: {subidas}")
    print(f"Ya estaban (salteadas): {salteadas}")
    print(f"Total en la carpeta: {total}")
    if errores:
        print(f"Errores: {len(errores)}")
        for nombre, err in errores:
            print(f"  - {nombre}: {err}")


if __name__ == "__main__":
    subir_imagenes()
