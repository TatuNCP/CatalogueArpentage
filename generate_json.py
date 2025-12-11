import pandas as pd
import json


# Define the function to generate the JSON catalog
def generate_catalog_json(csv_input_path='CatalogList.csv', json_output_path='catalog.json'):
    """
    Reads the CSV catalog data, generates the 'imagenes' array for the gallery,
    and saves the output to a JSON file.
    """

    # Load the CSV file
    df = pd.read_csv(
        csv_input_path,
        dtype={
            'lot':str,
            'prix':float},
        encoding='latin-1'
                     )



    # List to store the final catalog data
    catalog_data = []

    # Iterate over dataframe rows
    for index, row in df.iterrows():
        # Safely retrieve the number of additional images and price
        num_additional_images = int(row['num_add_img'])
        price_value = float(row['prix'])

        # Define variable names for the JSON fields
        lot_id = str(row['lot'])
        category_name = row['category']
        description_text = row['description']

        # 1. Initialize the images array
        image_list = []

        # Add the base image (e.g., "9.jpg")
        image_list.append(f"{lot_id}.jpg")

        # 2. Add additional images (e.g., "9_A.jpg", "9_B.jpg")
        if num_additional_images > 0:
            for i in range(1, num_additional_images + 1):
                # Generate letter suffix (A, B, C, ...)
                suffix_letter = chr(ord('A') + i - 1)
                additional_filename = f"{lot_id}_{suffix_letter}.jpg"
                image_list.append(additional_filename)

        # Build the item dictionary
        # Note: 'descripcion' field is kept in Spanish as requested
        item = {
            "lot": lot_id,
            "prix": price_value,
            "categorie": category_name,
            "descripcion": description_text,
            "imagenes": image_list
        }

        catalog_data.append(item)

    # Write the list to the JSON file
    with open(json_output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, ensure_ascii=False, indent=4)

    return json_output_path


# Execute the function
generate_catalog_json()