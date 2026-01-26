import pandas as pd
import json
import csv
import io


def generate_catalog_json(csv_input_path='CatalogList.csv', json_output_path='catalog.json'):
    print(f"🔄 Leyendo archivo: {csv_input_path}...")

    # LEER ARCHIVO Y PREPARARLO (Truco para arreglar comas malas antes de que Pandas lo toque)
    try:
        with open(csv_input_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except UnicodeDecodeError:
        print("⚠️ Encoding antiguo detectado. Usando Latin-1.")
        with open(csv_input_path, 'r', encoding='latin-1') as f:
            lines = f.readlines()

    if not lines:
        print("❌ Archivo vacío.")
        return

    # Limpiar cabecera de espacios extraños (ej: "units ")
    header_line = lines[0].strip()
    headers = [h.strip().lower() for h in header_line.split(',')]
    num_expected_cols = len(headers)

    # Pre-procesar líneas para unir comas sobrantes
    cleaned_lines = [header_line]
    for i in range(1, len(lines)):
        line = lines[i].strip()
        if not line: continue

        parts = line.split(',')

        # Si hay más columnas de las esperadas, unimos las últimas
        if len(parts) > num_expected_cols:
            fixed_part = ",".join(parts[num_expected_cols - 1:])  # Unir todo lo que sobra
            parts = parts[:num_expected_cols - 1]  # Quedarse con el principio
            parts.append(f'"{fixed_part}"')  # Añadir el final entre comillas por seguridad

        cleaned_lines.append(",".join(parts))

    # Convertir lista de líneas en un "archivo virtual" para Pandas
    virtual_file = io.StringIO("\n".join(cleaned_lines))

    # CARGAR CON PANDAS FORZANDO TIPOS DE DATOS
    try:
        df = pd.read_csv(
            virtual_file,
            names=headers,  # Usamos nuestros headers limpios
            header=0,  # La primera línea es header
            dtype={'lot': str, 'units': int, 'num_add_img': int}  # FORZAR LOTE COMO TEXTO
        )
    except Exception as e:
        print(f"❌ Error crítico leyendo CSV: {e}")
        return

    # Mapeo de columnas flexible
    def get_val(row, aliases, default):
        for alias in aliases:
            if alias in row and pd.notna(row[alias]):
                return row[alias]
        return default

    catalog_data = []

    print(f"📦 Procesando {len(df)} artículos...")

    for index, row in df.iterrows():
        try:
            # 1. LOTE (Forzado a string y sin decimales .0)
            raw_lot = str(get_val(row, ['lot', 'id', 'lote'], '0')).strip()
            if raw_lot.endswith('.0'):
                lot_id = raw_lot[:-2]  # Quitar .0 si se coló
            else:
                lot_id = raw_lot

            # 2. PRECIOS
            try:
                price = float(get_val(row, ['prix', 'price', 'precio'], 0))
            except:
                price = 0.0

            try:
                unit_price = float(get_val(row, ['prix_unit', 'unit_price'], 0))
            except:
                unit_price = 0.0

            # 3. UNIDADES
            try:
                units = int(get_val(row, ['units', 'untits', 'unidades'], 1))
            except:
                units = 1
            if units < 1: units = 1

            # 4. IMÁGENES
            try:
                num_imgs = int(get_val(row, ['num_add_img', 'additional_img', 'num_imagenes'], 0))
            except:
                num_imgs = 0

            # 5. TEXTOS
            cat = str(get_val(row, ['category', 'categorie'], 'Divers')).strip()
            desc = str(get_val(row, ['description', 'descripcion'], '')).strip()
            details = str(get_val(row, ['details', 'detalles'], '')).strip()

            # 6. MANUAL
            manual = str(get_val(row, ['manuale', 'manual', 'manual_url'], '')).strip()
            if manual.lower() == 'nan': manual = ""

            # CONSTRUIR LISTA DE IMÁGENES
            imgs = [f"{lot_id}.jpg"]
            if num_imgs > 0:
                for n in range(1, num_imgs + 1):
                    suffix = chr(ord('A') + n - 1)
                    imgs.append(f"{lot_id}_{suffix}.jpg")

            # OBJETO FINAL
            item = {
                "lot": lot_id,
                "prix": price,
                "categorie": cat,
                "descripcion": desc,
                "detalles": details,
                "manual_url": manual,
                "imagenes": imgs,
                "units_available": units,
                "unit_price": unit_price
            }
            catalog_data.append(item)

        except Exception as e:
            print(f"⚠️ Error en fila {index}: {e}")
            continue

    # GUARDAR
    with open(json_output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, ensure_ascii=False, indent=4)

    print(f"✅ ¡Éxito! JSON generado: {json_output_path}")


if __name__ == "__main__":
    generate_catalog_json()