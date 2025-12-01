import pandas as pd
import json

# --- Config ---
file_csv = 'CatalogList.csv'
file_json_exit = 'catalog.json'
path_base_image = 'img/'

# read csv
try:
    df = pd.read_csv(
        file_csv,
        dtype={
            'lot':str,
            'prix':float},
        encoding='latin-1'
    )

except FileNotFoundError:
    print(f"Error:{archivo_csv} not found.")
    exit()

# Create image colummn
df['imageURL'] = path_base_image + df['lot'].astype(str) + '.jpg'
# Rename columns
df.columns = ['lot', 'prix', 'categorie', 'descripcion', 'imageURL']
# Convert and save JSON
#The parameter records ensures that returned objects is a list.
catalog_json = df.to_json(orient='records', indent=2, force_ascii=False)
#clean JASON
catalog_json_clean = catalog_json.replace('\\/', '/')

with open(file_json_exit,'w', encoding='utf-8') as f:
    f.write(catalog_json_clean)

print(f'Success the file {file_json_exit} has been generated with {len(df)} lots')
print(f'Make sure that the imagers are in the folde {path_base_image}')