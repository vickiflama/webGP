import boto3
import os
from botocore.config import Config

# ==================== CONFIGURACIÓN ====================
ACCESS_KEY_ID = "83c1f2e3fdaa2298dbf40a810c7a8158"
SECRET_ACCESS_KEY = "4035aeb921c1bfea81b9e6ec366bc00f991494167990bc4a88993434dd99aaae"
ENDPOINT_URL = "https://bb16912e4ee9aa916221eeb95d552af5.r2.cloudflarestorage.com"
BUCKET_NAME = "webgp-imagenes"
CARPETA_IMAGENES = r"C:\Users\Usuario\Desktop\imgweb"

# ==================== CONEXIÓN ====================
s3 = boto3.client(
    "s3",
    endpoint_url=ENDPOINT_URL,
    aws_access_key_id=ACCESS_KEY_ID,
    aws_secret_access_key=SECRET_ACCESS_KEY,
    config=Config(signature_version="s3v4"),
    region_name="auto",
)

# ==================== SUBIDA ====================
def subir_imagenes():
    archivos = [f for f in os.listdir(CARPETA_IMAGENES) if f.lower().endswith((".png", ".jpg", ".jpeg"))]
    total = len(archivos)
    print(f"Encontradas {total} imágenes para subir.\n")

    subidas = 0
    errores = []

    for i, nombre_archivo in enumerate(archivos, start=1):
        ruta_completa = os.path.join(CARPETA_IMAGENES, nombre_archivo)
        try:
            content_type = "image/png" if nombre_archivo.lower().endswith(".png") else "image/jpeg"
            s3.upload_file(
                ruta_completa,
                BUCKET_NAME,
                nombre_archivo,
                ExtraArgs={"ContentType": content_type},
            )
            subidas += 1
            print(f"[{i}/{total}] ✔ Subida: {nombre_archivo}")
        except Exception as e:
            errores.append((nombre_archivo, str(e)))
            print(f"[{i}/{total}] ✘ Error con {nombre_archivo}: {e}")

    print(f"\n--- Resumen ---")
    print(f"Subidas correctamente: {subidas}/{total}")
    if errores:
        print(f"Errores: {len(errores)}")
        for nombre, err in errores:
            print(f"  - {nombre}: {err}")

if __name__ == "__main__":
    subir_imagenes()